//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import { useState, useEffect } from 'react';
import { 
    Box,
    Button,
    ButtonDropdown,
    Container,
    ExpandableSection,
    FileUpload,
    FormField,
    Header,
    SpaceBetween,
    Spinner,
    Table
} from '@cloudscape-design/components';

import  { Job, JobProps, ListJobs} from './Job';
import './job.css';


import { 
    JobType,
    EvalDatasetApprovalStatus,
    EvalDatasetGenerationStatus,
    EvalStatus,
    RagIngestionStatus
} from '../../../amplify/data/resource';


const COLUMN_DEFS = [
    {
        id: 'jobName',
        header: 'Job Name',
        cell: (item: { name: string; }) => item.name,
        key: (item: { id: string; }) => item.id,
        isRowHeader: true
    },
    {
        id: 'jobType',
        header: 'Type',
        cell: (item: JobProps ) => item.jobType,
        key: (item: { id: string; }) => item.id,
        isRowHeader: true
    },
    {
        id: 'ragIngestionStatus',
        header: 'RAG Ingestion Status',
        cell: (item: { ragIngestionStatus: typeof RagIngestionStatus; }) => item.ragIngestionStatus,
        key: (item: { id: string; }) => item.id,
        isRowHeader: true
    },
    {
        id: 'selectedModels',
        header: 'Selected Models',
        cell: (item: { selectedModels: string; }) => {
            return (
                // <ExpandableSection variant="footer" headerText="Selected Models">
                <div className="jobModels">
                    {JSON.parse(item.selectedModels).join(", ")}
                </div>
                // </ExpandableSection>
            )
        },
        key: (item: { id: string; }) => item.id,
        isRowHeader: true,
        minWidth: 400
    },
    {
        id: 'lastUpdatedAt',
        header: 'Last Updated',
        cell: (item: { lastUpdatedAt: string[]; }) => item.lastUpdatedAt,
        key: (item: { id: string; }) => item.id,
        isRowHeader: true
    },
    {
        id: 'createdAt',
        header: 'Created',
        cell: (item: { createdAt: string | number | Date; }) => new Date(item.createdAt).toLocaleString(),
        key: (item: { id: string; }) => item.id,
        isRowHeader: true
    }
]

function JobsTable() {
    const [jobs, setJobs] = useState([])
    const [selectedItem, setSelectedItem] = useState({})
    const [tableData, setTableData] = useState([])
    const [tableLoadingState, setTableLoadingState] = useState(true)
    const [currentJob, setCurrentJob] = useState({})

    
    useEffect(() => {
        (async () => {
            setTableLoadingState(true)
            const jobsResponse = await ListJobs();
            console.log('jobsResponse:')
            console.dir(jobsResponse)
            setTableData(jobsResponse)
            // setTableData(jobs)
            setTableLoadingState(false)
        })()
    }, [])

    if (tableLoadingState) {
        return (
            <>
            <div style={{textAlign: "center"}}>
                Loading<br/>
                <Spinner size="large"/>
            </div>
            </>
        )
    }
    else {
        return (
            <>
            <Table
                className="jobsTable"
                columnDefinitions={COLUMN_DEFS}
                items={tableData}
                loadingText="Loading jobs"
                loading={tableLoadingState}
                selectionType="single"
                selectedItems={[selectedItem]}
                onSelectionChange={({ detail }) =>
                    setSelectedItem(detail.selectedItems[0] || {})
                }
                trackBy="id"
                // isItemDisabled={item =>{
                // // console.log("Got item")
                // // console.dir(item)
                // if (item.vector_db_type == 'shared') {
                //     return true
                // }
                // }}
                header={
                <Header
                    actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <ButtonDropdown
                        disabled={!(selectedItem && selectedItem.id)}
                        items={[
                            {
                                id: "edit",
                                // disabled: !currentCollection,
                                text: "View/Edit job",
                                href: `/#/jobs/${selectedItem !== null ? selectedItem.id : 'none'}/edit`,
                                // external: true,
                                // externalIconAriaLabel: "(opens in new tab)"
                            },
                            {
                                id: "delete",
                                // disabled: !currentCollection,
                                text: "Delete job",
                                href: `/#/jobs/${selectedItem ? selectedItem.id : 'none'}/delete`,
                                // external: true,
                                // externalIconAriaLabel: "(opens in new tab)"
                            }
                        ]}
                        >
                        Actions
                        </ButtonDropdown>
                        <Button href="/#/jobs/create" variant="primary">Create new job</Button>
                    </SpaceBetween>
                    }
                >
                    Jobs
                </Header>
                }
                footer={
                <Box textAlign="center">
                    {/*<Link href="#">View all documentollections</Link>*/}
                </Box>
                }
            />
            </>
        );
    }
}

export default JobsTable
// function DocumentCollectionsTable() {
//   useResetRecoilState(currentCollectionState)();
//   useResetRecoilState(urlCollectionIdState)();
//   useResetRecoilState(uploadedFilesState)();
//   const [docCollections, setDocCollections] = useRecoilState(docCollectionsState);
//   // const [files, setFiles] = useState([]);
//   const [selectedItem, setSelectedItem] = useState({});
//   const [currentCollection, setCurrentCollection] = useRecoilState(currentCollectionState);
//   // const [currentCollectionContents, setCurrentCollectionContents] = useState();
//   // const atLeastOneSelected = selectedItem ? true :  false;
//   const [tableData, setTableData] = useState([])
//   const [tableLoadingState, setTableLoadingState] = useState(true)

//   useEffect(() => {
//     (async () => {
//       setTableLoadingState(true)
//       let collections = await getTableProvider()
//       let tmpTableData = []
//       let tmpDocCollections = []
//       console.log("Got docCollections:")
//       console.dir(collections)
      
//       collections.forEach(collection => {
//           let disabled = false
//           let cn = (' ' + collection.collection_name).slice(1)
//           // console.log("Got collection:")
//           // console.dir(collection)
//           // console.log(`vector_db_type = ${collection.vector_db_type}`)
//           if (collection.vector_db_type != 'shared') {
//             cn = <a title={cn} href={`/#/document-collections/${collection.collection_id}/edit`}>{cn}</a>
//           }
//           else {
//             // console.log("shared collection...disabling row.")
//             disabled = true
//           }
//           // console.log(`should this row be disabled? ${disabled}`)
//           let newTableRow = {
//             collection_id: collection.collection_id,
//             collection_name: cn,
//             description: collection.description,
//             updated_date: collection.updated_date,
//             vector_db_type: collection.vector_db_type,
//             disabled: disabled
//           }
//           // console.log("got newCollection:")
//           // console.dir(newCollection)
//           tmpTableData.push(newTableRow)
//           let newCollection = {...newTableRow}
//           // remove the link from the collection name and save it
//           // for use in drop-downs elsewhere, like ChatPlayground.jsx
//           newCollection.collection_name = (' ' + collection.collection_name).slice(1)
//           tmpDocCollections.push(newCollection)
//       })
//       setTableData(tmpTableData)
//       setDocCollections(tmpDocCollections)
//       console.log("Setting tableLoadingState = false")
//       setTableLoadingState(false)
//     })()
//   }, [])

//   useEffect(() =>{
//     // if (tableData.length > 0) {
//     //   // console.log("docCollections changed")
//     //   // console.dir(docCollections)
//     //   setTableLoadingState(false)
//     // }
//     // setTableLoadingState(false)
//     // // console.log("set tableLoadingState to false")
//   }, [tableData])

  function showDetails(selected) {
    // // console.log("ShowDetails got selected");
    // // console.dir(selected)
    setSelectedItem(selected)
    setCurrentCollection(selected)
  }

//   if (tableLoadingState) {
//     return (
//       <>
//         <div style={{textAlign: "center"}}>
//           Loading<br/>
//           <Spinner size="large"/>
//         </div>
//       </>
//     )
//   }
//   else {
//     return (
//       <>
//         <Table
//           className="documentCollectionsTable"
//           columnDefinitions={DOCUMENT_COLLECTIONS_COLUMN_DEFINITIONS}
//           items={tableData}
//           wrapLines='true'
//           loadingText="Loading document collections"
//           loading={tableLoadingState}
//           ariaLabels={logsTableAriaLabels}
//           selectionType="single"
//           selectedItems={[selectedItem]}
//           onSelectionChange={({ detail }) =>
//             showDetails(detail.selectedItems[0])
//           }
//           isItemDisabled={item =>{
//             // console.log("Got item")
//             // console.dir(item)
//             if (item.vector_db_type == 'shared') {
//               return true
//             }
//           }}
//           header={
//             <Header
//               actions={
//                 <SpaceBetween direction="horizontal" size="xs">
//                   <ButtonDropdown
//                     items={[
//                       {
//                         id: "edit",
//                         disabled: !currentCollection,
//                         text: "Edit or delete collection",
//                         href: `/#/document-collections/${currentCollection ? currentCollection.collection_id : 'none'}/edit`,
//                         // external: true,
//                         // externalIconAriaLabel: "(opens in new tab)"
//                       }
//                     ]}
//                   >
//                     Actions
//                   </ButtonDropdown>
//                   <Button href="/#/document-collections/create" variant="primary">Create new document collection</Button>
//                 </SpaceBetween>
//               }
//             >
//               Document Collections
//             </Header>
//           }
//           footer={
//             <Box textAlign="center">
//               {/*<Link href="#">View all documentollections</Link>*/}
//             </Box>
//           }
//         />
//       </>
//     );
//   }
// }


// export default DocumentCollectionsTable;