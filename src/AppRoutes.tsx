//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import { Component } from 'react';
// import ChatPlayground from './ChatPlayground';
// import DocumentCollectionForm from './DocumentCollectionForm';
// import DocumentCollectionsTable from './DocumentCollectionsTable';
// import GraphVisualization from './GraphVisualization';
// import LogOut from './LogOut';
// import PromptTemplateForm from './PromptTemplateForm'
// import PromptTemplatesTable from './PromptTemplatesTable';
import { HashRouter, Route, Routes} from 'react-router-dom';

import JobsTable from './modules/jobs/JobsTable';
import JobForm from './modules/jobs/JobForm';

class AppRoutes extends Component {
    signOut: any;
    // constructor(props: {}) {
    constructor(props: { signOut: any; }) {
      super(props)
      this.signOut = props.signOut;
      this.render = this.render.bind(this);
    }
    render() {
      return (
        <HashRouter>
          <Routes>
            {/* <Route path='/' element={<h1>Testing</h1>}/> */}
            <Route path='/' element={<JobsTable/>}/>
            <Route path='/jobs' element={<JobsTable/>}/>
            <Route path='/jobs/create' element={<JobForm/>}/>
            <Route path='/jobs/:id/edit' element={<JobForm/>}/>
            <Route path='/jobs/:id/delete' element={<JobForm/>}/>

            {/* <Route path='/chat-playground' element={<ChatPlayground updateSplitPanelContent={this.updateSplitPanelContent} className="chatPlayground"/>}/>
            <Route path='/document-collections' element={<DocumentCollectionsTable className="documentCollectionsTable"/>}/>
            <Route path='/document-collections/create' element={<DocumentCollectionForm className="documentCollectionsForm"/>}/>
            <Route path='/document-collections/:id/edit' element={<DocumentCollectionForm className="documentCollectionsForm"/>}/> */}
            {/* <Route path='/logout' element={<LogOut/>}/> */}
            {/* <Route path='/graph-visualization' element={<GraphVisualization className="graphVisualization"/>}/>
            <Route path='/prompt-templates' element={<PromptTemplatesTable className="promptTemplatesTable"/>}/>
            <Route path='/prompt-templates/create' element={<PromptTemplateForm className="promptTemplatesForm"/>}/>
            <Route path='/prompt-templates/:id/edit' element={<PromptTemplateForm className="promptTemplatesForm"/>}/> */}
            {/* <Route path='/rag-playground' element={<RagPlayground className="ragPlayground"/>}/> */}
          </Routes>
        </HashRouter>
      )
    }
}
export default AppRoutes;
