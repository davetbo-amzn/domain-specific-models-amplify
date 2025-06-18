//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import { useEffect, useState } from 'react'
import { Button, Container, Form, Header, Input, Link, SpaceBetween, Table } from '@cloudscape-design/components'

import { JobProps } from './Job';
import { JobFile, JobFileProps, ListJobFiles } from './JobFile';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal'
import { ThemeProvider } from '@aws-amplify/ui-react';
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';


const filePageSize = 20

const uploaderTheme = {
  name: 'uploaderTheme',
  tokens: {
    components: {
      fileuploader: {
        dropzone: {
          display: '{none}',
        }
      }
    }
  }
}
// async function getTableProvider(collectionId, limit=20, lastEvalKey='') {
//   //// // console.log("newApi:")
//   //// // console.dir(provider)
//   const data = await api.listUploadedFiles(collectionId, limit, lastEvalKey);
//   // // console.log("getTableProvider received data:")
//   // // console.dir(data)
//   return data;
// }

const UPLOADED_DOCUMENTS_COLUMN_DEFINITIONS = [
    {
      id: 'key',
      header: 'File Name',
      cell: (item: JobFileProps) => <Link /*onClick={item.onClick}*/>{item.location}</Link>,
      key: (item: JobFileProps) => item.key,
      isRowHeader: false,
      // isItemDisabled: (item: { hasOwnProperty: (arg0: string) => any; disabled: any; }) => item.hasOwnProperty('disabled') ? item.disabled : false
    },
    {
      id: 'name',
      header: 'File Name',
      cell: (item: JobFileProps) => <Link /*onClick={item.onClick}*/>{item.location}</Link>,
      key: (item: JobFileProps) => item.name,
      isRowHeader: true,
      // isItemDisabled: (item: { hasOwnProperty: (arg0: string) => any; disabled: any; }) => item.hasOwnProperty('disabled') ? item.disabled : false
    },
    {
      id: 'ingestionStatus',
      header: 'Ingestion Status',
      cell: (item: JobFileProps) => item.ingestionStatus,
      isRowHeader: true,
    },
    {
      id: 'vectorizationStatus',
      header: 'Vectorization Status',
      cell: (item: JobFileProps) => item.vectorizationStatus,
      isRowHeader: true,
    }
];

type UploadedFile = {
  key: string,
  name: string,
  location: string,
  ingestionStatus: string,
  vectorizationStatus: string,
  jobId: string
}


function UploadedDocumentsTable(props: { jobId: string; }) {
  const jobId: string = props.jobId;
  // const [confirmationModal, setConfirmationModal] = useRecoilState(confirmationModalState)
  // const currentCollection = useRecoilValue(currentCollectionState)
  // const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [filesVal, setFilesVal] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [lastEvalKey, setLastEvalKey] = useState(null)
  // const [selectedFileUpload, setSelectedFileUpload] = useRecoilState(selectedFileUploadState)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  useEffect(() => {
    if (jobId) {
      (async () => {
        setIsLoading(true)
        let response = await ListJobFiles(jobId)
        console.log("Got ListJobFiles response:")
        console.dir(response)
        let tableData: UploadedFile[] = []
        response.forEach(tmpJobFile => {
          let tmpFile: UploadedFile = {
            key: tmpJobFile.jobFileId ?? '',
            name: tmpJobFile.name,
            location: tmpJobFile.location,
            ingestionStatus: tmpJobFile.ingestionStatus ?? 'NOT_STARTED',
            vectorizationStatus: tmpJobFile.vectorizationStatus ?? 'NOT_STARTED',
            jobId: tmpJobFile.jobId ?? ''
          }
          tableData.push(tmpFile)
        })
        // if (!tmpFiles || tmpFiles.length == 0) {
        //   tmpFiles  = [{
        //     name: "No files uploaded yet.",
        //     location: "none"
        //     ingestionStatus: "",
        //     vectorizationStatus: "",
        //   }]
        // }
        // else {
        //   console.dir(tmpFiles)
        //   for (let i = 0; i < tmpFiles.length; i++) {
        //     tmpFiles[i].key = `tmpFile_${i}`
        //     // tmpFiles[i].onClick = async () => await api.downloadFile(
        //     //   jobId,
        //     //   tmpFiles[i].file_name
        //     // );
        //   }
        // }
        setUploadedFiles(tableData)
        setIsLoading(false)
      })()
    }
  }, [jobId])
  // const deleteConfirmationMessageState = atom({
  //   key: 'UploadedDocumentsTable.deleteConfirmationMessageState',
  //   default: `Are you sure you want to delete the file ${selectedFileUpload ? selectedFileUpload['file_name'] : ''}?`
  // })
  // const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useRecoilState(deleteConfirmationMessageState)

  // const currentCollectionId = selector({
  //   key: 'currentCollectionId', // unique ID (with respect to other atoms/selectors)
  //   get: ({get}) => {
  //     const currentColl = get(currentCollectionState);
  //     return currentColl ? currentColl.collectionId : null;
  //   },
  // });

  // useEffect(() => {
  //   if (currentCollection.hasOwnProperty('collectionId') && 
  //       currentCollection.collectionId.length == 32 ) {
  //     (async () => {
  //       setIsLoading(true)
  //       let tmpFiles = await getTableProvider(currentCollection.collectionId, filePageSize, lastEvalKey)
  //       console.log("Got tmpFiles:")
  //       if (!tmpFiles || tmpFiles.length == 0) {
  //         tmpFiles = [{
  //       e    "key": "no-files-uploaded",
  //           "file_name": "No files uploaded yet.",
  //           "status": "",
  //           "disabled": true
  //         }]
  //       }
  //       else {
  //         console.dir(tmpFiles)
  //         for (let i = 0; i < tmpFiles.length; i++) {
  //           tmpFiles[i].key = `tmpFile_${i}`
  //           tmpFiles[i].onClick = async () => await api.downloadFile(
  //             currentCollection.collectionId, 
  //             tmpFiles[i].file_name
  //           );
  //         }
  //         setUploadedFiles(tmpFiles)
  //         setLastEvalKey(tmpFiles[tmpFiles.length - 1]['file_name'])
  //       }
  //       setIsLoading(false)
  //     })()
  //   }
  // }, [currentCollection, lastEvalKey])

  // useEffect(() => {
  //   // console.log("Set uploaded files to ")
  //   // console.dir(uploadedFiles)
  //   if (uploadedFiles) {
  //     setIsLoading(false)
  //   }
  //   // setIsLoading(false)
  // }, [uploadedFiles])

  // useEffect(() => {
  //   // console.log("Set selected file upload to ")
  //   // console.dir(selectedFileUpload)
  //   if (!selectedFileUpload) {
  //     setIsLoading(false)
  //   }
  // }, [selectedFileUpload])

  // useEffect(() => {
  //   (async () => {
  //     if (currentCollection && filesVal.length > 0) {
  //       setIsLoading(true)
  //       console.log('uploading files')
  //       let result = await api.uploadFiles(currentCollection.collectionId, filesVal);
  //       console.log("file upload result: ")
  //       console.dir(result)
  //       setFilesVal([])
  //       console.log('done uploading files.')
  //       let tmpFiles = await getTableProvider(currentCollection.collectionId, filePageSize, lastEvalKey)
  //       console.log("after filesVal, Got tmpFiles:")
  //       console.dir(tmpFiles)
  //       if (tmpFiles.length > 0) {
  //         setUploadedFiles(tmpFiles)
  //         setLastEvalKey(tmpFiles[tmpFiles.length - 1]['file_name'])
  //       }
  //       else {
  //         setUploadedFiles([])
  //       }
  //     }
  //   })()
  // }, [currentCollection, filesVal])

  // function confirmDeleteFile(evt: unknown) {
  //   // console.log('confirmDeleteFile received event')
  //   // console.dir(selectedFileUpload)
  //   // console.log(`confirming delete file ${selectedFileUpload['file_name']}`)
  //   setConfirmationModal(
  //     <DeleteConfirmationModal
  //       message={deleteConfirmationMessage}
  //       deleteFn={deleteFile}
  //       evt={evt}
  //       deleteRedirectLocation={window.location.href}
  //       resourceId={selectedFileUpload['file_name']}
  //       visible={true}
  //     />
  //   )
  //   setDeleteModalVisible(true)
  //   evt.preventDefault()
  // }

  // async function deleteFile(resourceId: any, evt: any) {
  //   await api.deleteFile(
  //     currentCollection.collectionId, 
  //     resourceId
  //   )
  //   setDeleteModalVisible(false)
  //   setConfirmationModal('')
  //   setSelectedFileUpload('')
  //   // setIsLoading(true)
  //   reloadTable(evt)
  //   // evt.preventDefault()
  // }

  function reloadTable(evt: undefined) {
    (async () => {
      setIsLoading(true)
      let tmpFiles = await ListJobFiles(jobId);
      setUploadedFiles(tmpFiles)
      setIsLoading(false)
    })()
    // evt.preventDefault()
  }

  // function checkInUploadedFiles(file: { name: any; }) {
  //   console.log("Checking if file is in uploaded files:")
  //   console.dir(file)
  //   console.dir(uploadedFiles)
  //   for (let i = 0; i < uploadedFiles.length; i++) {
  //     if (uploadedFiles[i]['file_name'] == file.name) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  function updateFilesVal(files: Record<string, any>) {
    // setIsLoading(true)
    console.log('Update files received:')
    let tmpUploadedFiles = [...uploadedFiles]
    console.dir(files)
    for (let i = 0; i < files.length; i++) {
      files[i].key = `uploaded_file ${i}`
    }
    setFilesVal(files);
    reloadTable()
    // // console.log("filesVal is now");
    // // console.dir(files)
    // setIsLoading(false)
  }

  // async function uploadFiles() {
  //   setIsLoading(true)
  //   console.log("filesVal before uploadFiles")
  //   console.dir(filesVal)
  //   let result = await api.uploadFiles(currentCollection.collectionId, filesVal);
  //   if (result) {
  //     // // console.log("uploadFiles result:")
  //     // // console.dir(result)
  //     setFilesVal([])
  //     // setUploadedFiles([])
  //     let tmpFiles = await getTableProvider(currentCollection.collectionId, filePageSize, lastEvalKey)
  //     console.log("Got tmpFiles")
  //     console.dir(tmpFiles)
  //     setUploadedFiles(tmpFiles['files'])
  //   }
  //   setIsLoading(false)
  // }

  return (
    <>
    <SpaceBetween direction='vertical' size='xs'>
      <ThemeProvider theme={uploaderTheme}>
        <h4>Upload Files</h4>
        <FileUploader    
          acceptedFileTypes={['*/*']}   
          path={({ identityId }) => `private/${identityId}/jobs/${jobId}/`}
          maxFileCount={1000}
          isResumable={true}
          onSuccess={() => reloadTable(undefined)}
        /> 
      </ThemeProvider>
        <Table
          loadingText="Loading uploaded documents list."
          columnDefinitions={UPLOADED_DOCUMENTS_COLUMN_DEFINITIONS}
          items={uploadedFiles}
          selectionType="single"
          loading={isLoading}
          // selectedItems={[selectedFileUpload]}
          // onSelectionChange={({detail}) => {
          //   // // console.log("Selected file:")
          //   // // console.dir(detail.selectedItems[0])
          //   setSelectedFileUpload(detail.selectedItems[0])
          // }}
          header={
            <Header
              actions={
                <SpaceBetween direction='horizontal' size='xs'>
                  <Button formAction="none" onClick={reloadTable} iconName="refresh" variant="normal" />
                  {/* <Button 
                    onClick={uploadFiles}
                    disabled={filesVal.length === 0 || isLoading}
                    variant='primary'
                  >
                    Upload
                  </Button> */}
                  {/* <Button onClick={confirmDeleteFile} 
                    disabled={selectedFileUpload === ''}>
                    Delete file
                  </Button> */}
                </SpaceBetween>
              }
              variant="h4"
            >
              Uploaded Files 
            </Header>
          }
        ></Table>
      </SpaceBetween>
      {/* {confirmationModal} */}
    </>
  )
}

export default UploadedDocumentsTable;