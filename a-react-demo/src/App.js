import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

function App () {
  const [ value, setValue ] = useState( "" );
  return (
    <div className="App">
      <header className="App-header">
        <img src={ logo } className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <input value={ value } type="text" placeholder='haha' onChange={ ( e ) => setValue( e.target.value ) } />
      </header>
      
    </div>
  );
}
// ReactDOM  触发状态更新 => render阶段 => commit阶段
// ReactDOM调用render时会生成fiberRootNode,这个节点指向current fiber树
// 而在react有两棵fiber树, 页面渲染的为current fiber树,在内存中负责更新的为 workInProgress fiber树,两个树的节点一一对应,current fiber树的alternate属性指向对应workInPorogress属性
//在mount阶段 currentFiber为null(update阶段则不会),react源码则是根据 current===null来判断当前组件是否处于 mount还是update的


// 在render阶段,render阶段开始于performSyncWorkOnRoot或performConcurrentWorkOnRoot方法的调用。这取决于本次更新是同步更新还是异步更新
// performUnitOfWork方法会创建下一个Fiber节点并赋值给workInProgress，并将workInProgress与已创建的Fiber节点连接起来构成Fiber树
// 遍历workInProgress Fiber树时,会先调用每个FiberNode上的beginWork方法,然后采用深度优先遍历,一直遍历到没有子节点,然后从子节点开始调用completeWork方法一直到rootFiber节点
// beginWork和completeWork函数有三个参数: beginWork(current, workInProgress, renderLanes)
// current指的是currentFiber树上的节点,workInProgress指的是 workInProgress树上的结点,renderLanes则表示优先级,在mount时,这个current是null

// 在build过后的源码中,可以在react-dom找到对应的beginWork和completeWork
export default App;

/* 
创建fiberRootNode、rootFiber、updateQueue（`legacyCreateRootFromDOMContainer`）

    |
    |
    v

创建Update对象（`updateContainer`）

    |
    |
    v

从fiber到root（`markUpdateLaneFromFiberToRoot`）

    |
    |
    v

调度更新（`ensureRootIsScheduled`）

    |
    |
    v

render阶段（`performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`）

    |
    |
    v

commit阶段（`commitRoot`）


*/