// 有类似于组件




function dispatchAction ( queue, action ) {
  // 创建update
  const update = {
    //更新执行的函数
    action,
    // 与同一个hooks的其他更新形成单向链表
    next: null
  }

  // 环状单向链表操作
  if ( queue.pending === null ) {
    update.next = update
  }else{
    // 如果queue的pending指针不为null,即新增了一个update对象,则将update的next指针指向queue的pending指针的next指针对象
    update.next=queue.pending.next;
    queue.pending.next=update;// 队列的pending指针的next指针 指向update,形成环状
  }
  queue.pending=update;

  // 模拟react开始调度更新
  schedule();
}

// 上面更新产生的 update对象会存在 queue中
//  但是 queue会存在 FunctionComponent对应的fiber中
// fiber的数据结构
// App组件对应的fiber对象
const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App,
};

// hook的数据结构,hook来源于 fiber中的memoziedState
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

// 首次render时是mount
const isMount=true;
function schedule(){
   // 更新前将workInProgressHook重置为fiber保存的第一个Hook
   workInProgressHook = fiber.memoizedState;
   // 触发组件render
   fiber.stateNode();
   // 组件首次render为mount，以后再触发的更新为update
   isMount = false;
}

/* 

注意区分update与hook的所属关系：
每个useState对应一个hook对象。
调用const [num, updateNum] = useState(0);时updateNum（即上文介绍的dispatchAction）产生的update保存在useState对应的hook.queue中。


通过workInProgressHook变量指向当前正在工作的hook。

workInProgressHook = fiber.memoizedState;
在组件render时，每当遇到下一个useState，我们移动workInProgressHook的指针。

workInProgressHook = workInProgressHook.next;

这样，只要每次组件render时useState的调用顺序及数量保持一致，
那么始终可以通过workInProgressHook找到当前useState对应的hook对象。

这就是hooks不能放在条件语句或者说只能放在顶层语句中的原因,因为会破坏hooks的调用顺序和数量


*/

/* 
到此为止，我们已经完成第一步。

通过一些途径产生更新，更新会造成组件render。

接下来实现第二步。

组件render时useState返回的num为更新后的结果
*/

// 计算state

// App组件调用时,每次都会进行render和调用 `useState`之类的hooks
function useState(initialState) {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        pending: null,
      },
      memoizedState: initialState,
      next: null,
    };
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next);

    hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}