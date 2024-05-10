1. fiber是什么,为什么要用fiber?
在react15以及之前是递归更新,一旦开始就无法停止,
react16中fiber和scheduler架构的更新使得react的更新由 不可中断的同步 变更为 可中断的异步,
Scheduler其实就相当于浏览器的API requestIdleCallback的polyfill,但是由于兼容性和触发频率不稳定的问题,react重新实现了一个
Reconciler在react16中从react15的不可中断的递归处理虚拟DOM 变成了 可以中断的循环给虚拟DOM标记下一步的动作(更新,删除修改)交给renderer渲染
react16的更新流程大致变为 点击按钮 => scheduler(计算时间,分配任务) => reconciler(双缓存,构建Fiber树,Fiber树和ReactElement的虚拟DOM树是互相对应的,每个fiber节点包含了更新时要执行的动作) =>renderer

Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上


mount时, 首次执行ReactDOM的createRoot/render函数会创建fiberNodeRoot,fiberNodeRoot这是整个应用的根节点,根节点指向current rootFiber
jsx=> react17(可以不需要显式引入//zh-hans.legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)以下为 React.createElement 
React.createElement 中最后调用了ReactElement方法,并返回  => 在mount阶段 reconciler根据jsx的调用结果来生成Fiber节点

2. 在update时,状态是如何保存的
更新产生的update对象储在 一个单向环状链表的队列中
在class component中,状态可以保存在实例中
而在function component中,状态被存于fiber中,fiber.memoizedState,这个memoizedState保存的Hook解构也是一个无环的单向链表

3. 注意区分update与hook的所属关系：
每个useState对应一个hook对象。
调用const [num, updateNum] = useState(0);时updateNum（即上文介绍的dispatchAction）产生的update保存在useState对应的hook.queue中。

4. hook与FunctionComponent fiber都存在memoizedState属性，不要混淆他们的概念。
fiber.memoizedState：FunctionComponent对应fiber保存的Hooks链表。
hook.memoizedState：Hooks链表中保存的单一hook对应的数据。

5. react,vue2,vue3diff算法的不同
React diff 特点 - 单节点和多节点对fiber链表进行遍历, 多节点的情况会分两轮遍历，第一轮遍历会尝试逐个的复用节点，第二轮遍历处理上一轮遍历中没有处理完的节点。仅向右移动,深度优先遍历,fiber由于单向链表特性,没有反向pre指针(blog.csdn.net/m0_51969330/article/details/133134227),无法使用双指针进行优化
￼
￼


Vue2 diff 特点 - 双指针同时遍历, 进行双端比较,也可以减少不必要的DOM操作
Vue3 diff 特点 - 最长递增子序列,通过前前后后双端比较找到不变节点,划出来剩下的取域中找到最大的不需要改变的范围,其他的则做移动或者删除新增即可,这种对比方法可以 尽量减少 DOM 的移动，达到操作变更最少的 DOM 操作
￼

key的重要作用:如果没有key,则所有元素全部会被新建删除,而不知道这个元素有没有移动,例如react的diff算法在多节点情况下第二轮遍历时会根据key来进行比较移动DOM节点的优化

6. vue和react的组件状态更新
vue主要是进行组件的依赖收集和观察者模式进行颗粒度更新,然后进行绑定(所以要尽量减少不必要的响应式数据,vue2/3也有优化算法)
react16则使用的fiber来进行状态更新
￼
7. 理解react双缓存, react内部的fiber是如何区分mount和 update阶段的
React使用“双缓存”来完成Fiber树的构建与替换——对应着DOM树的创建与更新

首次执行ReactDOM.render会创建fiberRootNode（源码中叫fiberRoot）和rootFiber。其中fiberRootNode是整个应用的根节点，rootFiber是<App/>所在组件树的根节点。
之所以要区分fiberRootNode与rootFiber，是因为在应用中我们可以多次调用ReactDOM.render渲染不同的组件树，他们会拥有不同的rootFiber。但是整个应用的根节点只有一个，那就是fiberRootNode。
fiberRootNode的current会指向当前页面上已渲染内容对应Fiber树，即current Fiber树

在React中最多会同时存在两棵Fiber树。
当前屏幕上显示内容对应的Fiber树称为current Fiber树，
正在内存中构建的Fiber树称为workInProgress Fiber树。
current Fiber树中的Fiber节点被称为current fiber，
workInProgress Fiber树中的Fiber节点被称为workInProgress fiber，他们通过alternate属性连接。
	currentFiber.alternate === workInProgressFiber;
	workInProgressFiber.alternate === currentFiber;
React应用的根节点通过使current指针在不同Fiber树的rootFiber间切换来完成current Fiber树指向的切换。
即当workInProgress Fiber树构建完成交给Renderer渲染在页面上后，应用根节点的current指针指向workInProgress Fiber树，此时workInProgress Fiber树就变为current Fiber树。
每次状态更新都会产生新的workInProgress Fiber树，通过current与workInProgress的替换，完成DOM更新。

在mount阶段,由于是首屏更新,current Fiber树当前为null, 而workInProgree正在内存中根据JSX生成对应的Fiber树节点,然后已经构建好了的workInProgress Fiber树会在 commit阶段渲染到页面,fiberRooNode的current指针 此时也会指向这个 workInProgress,由此完成两个Fiber 树的替换
更新阶段也是一样,只不过current Fiber树已经有内容了
所以在react源码中,可以根据 current fiber如果为null则是在mount阶段,因为在mount和update,react很多时候内部hooks执行的函数是不同的

8. beginWork和completeWork
beginWork和completeWork函数有三个参数: beginWork(current, workInProgress, renderLanes)
current指的是currentFiber树上的节点,workInProgress指的是 workInProgress树上的结点,renderLanes则表示优先级,在mount时,这个current是null

在render阶段,render阶段开始于performSyncWorkOnRoot或performConcurrentWorkOnRoot方法的调用。这取决于本次更新是同步更新还是异步更新
performUnitOfWork方法会创建下一个Fiber节点并赋值给workInProgress，并将workInProgress与已创建的Fiber节点连接起来构成Fiber树
遍历workInProgress Fiber树时,会先调用每个FiberNode上的beginWork方法,然后采用深度优先遍历,一直遍历到没有子节点,然后从子节点开始调用completeWork方法一直到rootFiber节点

9. commit阶段下的useEffect为什么要进行异步调用
  + Renderer工作的阶段被称为commit阶段。commit阶段可以分为三个子阶段：
    + before mutation阶段（执行DOM操作前）
      + before mutation阶段的代码很短，整个过程就是遍历effectList并调用commitBeforeMutationEffects函数处理。
      + commitBeforeMutationEffects调用`useEffect`
    + mutation阶段（执行DOM操作）
    + layout阶段（执行DOM操作后）
  [useEffect的异步调用](./assets/useEffect为什么要异步调用.png)

10. 为什么react hooks只能在函数顶层声明,ClassComponent存在实例中, Function Component的状态存在哪里?

=== 从react设计的源码的角度来看
+ 以 `useState为例子`
    [alt text](./assets/react%20hooks为什么只能顶层声明.png)
    有如下 FunctionComponent
    ```js 
    function App(){
      const [state,updateState]=useState();
      return (
        <p
        onClick={ () => {
          updateState( ( state ) => state + 1 );
          updateState( ( state ) => state + 1 );
          updateState( ( state ) => state + 1 );
        } }
      >
        { state }
      </p>
      )
    }
    ```
    + 将更新的工作分为两种
      + 通过一些途径产生更新，更新会造成组件render
      + 组件render 时`useState`返回的`state`为更新后的结果
    + 其中步骤1的更新可以分为mount和update：
      调用ReactDOM.render会产生mount的更新，更新内容为useState的initialValue（即0）。
      点击p标签触发updateNum会产生一次update的更新，更新内容为num => num + 1。
    1. 调用`updateState`时会产生一个`update`对象,`update`对象的数据结构如下:
      + ```js 
          const update = {
          //更新执行的函数
          action,
          // 与同一个hooks的其他更新形成单向链表
          next: null
          }
        ```
    2. 当App组件调用 `updateState`时,其实就相当于在调用`dispatchAction.bind(null,hook.queue)`,每调用一次会产生一个`update`对象,而`update`则被存储于`queue`中(环状单向链表)
      + ```js
          function dispatchAction(queue, action) {
            // 创建update
            const update = {
              action,
              next: null,
            };

            // 环状单向链表操作
            if (queue.pending === null) {
              update.next = update;
            } else {
              //如果queue的pending指针不为null,即新增了一个update对象,
              //则将update的next指针指向queue的pending指针的next指针对象
              update.next = queue.pending.next;
              queue.pending.next = update;
            }
            queue.pending = update;

            // 模拟React开始调度更新
            schedule();
          }
        ```
    3. 调用`updateState`即更新产生的`update`对象会被存储于**单向环状列表**`queue`中,而`queue`存储在App组件render时生成的`Hooks`对象上,大概流程如下所示
        有对应的App的fiber精简的结构
        ```js 
          // App组件对应的fiber对象
          const fiber = {
            // 保存该FunctionComponent对应的Hooks链表
            memoizedState: null,
            // 指向App函数
            stateNode: App,
          };
        ```
      + 在 `fiber.memoziedState`的属性中也存在一个单向链表,存储着App中的`Hooks`,
        因为useState时这个是可以在App组件中调用多次的,也就意味着会生成多个的`Hooks`对象,被存在于上述属性做为一个**无环的单向列表结构**,而`update`的`queue`是一个环状单向链表,注意区别
      + 对应精简的Hooks数据结构如下:
        ```js 
          hook = {
          // 保存update的queue，即上文介绍的queue
          queue: {
            pending: null,
          },
          // 保存hook对应的state
          memoizedState: initialState,
          // 与下一个Hook连接形成单向无环链表
          next: null,
          };
        ```
    4. 这里也就意味着, App组件如果调用两次 `useState`,对应App的fiber节点的memoizedState就会有两个`Hooks`,某个`updateState`被调用了多次,对应`Hooks`对象上的`queue`属性就会有多个`update`对象
    5. React的调度更新流程如下:
        在上文dispatchAction末尾我们通过schedule方法模拟React调度更新流程。
        ```js 
          function dispatchAction(queue, action) {
            // ...创建update

            // ...环状单向链表操作

            // 模拟React开始调度更新
            schedule();
          }
        ```
        我们用isMount变量指代是mount还是update
        ```js 
        // 首次render时是mount
        isMount = true;

        function schedule() {
          // 更新前将workInProgressHook重置为fiber保存的第一个Hook
          workInProgressHook = fiber.memoizedState;
          // 触发组件render
          fiber.stateNode();
          // 组件首次render为mount，以后再触发的更新为update
          isMount = false;
        }
        ```
        通过workInProgressHook变量指向当前正在工作的hook。
        ```js 
          workInProgressHook = fiber.memoizedState;
        ```
        只要在组件render时，每当遇到下一个`useState`，我们移动`workInProgressHook`的指针。
        由于React这样的设计，只要**每次组件render时useState的调用顺序及数量保持一致，那么始终可以通过workInProgressHook找到当前useState对应的hook对象**。
        而在react中正是这样一种实现方式
=== 为什么要这样设计呢? 不能给hooks加个key之类的吗?这样会增加状态管理的复杂性
 