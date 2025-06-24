//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0
import {v4 as uuidv4 } from 'uuid';
import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Container, Form, FormField, Header, Input, RadioGroup, SpaceBetween, Spinner, Tabs, Multiselect, Box } from '@cloudscape-design/components';
import { useParams } from 'react-router-dom';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal'
import { CreateJob, DeleteJob, GetJob, JobProps, JobType, EvalDatasetApprovalStatus, EvalDatasetGenerationStatus, EvalStatus, ListJobs, RagIngestionStatus, UpdateJob } from './Job'
import { CreateJobFile, JobFileProps } from './JobFile'
import UploadedDocumentsTable from './UploadedDocumentsTable'
import config from '../../config.json';
import { Cache } from 'aws-amplify/utils';


function JobForm() {
  const urlParams = useParams()
  const path: string = window.location.hash;
  const [confirmationModal, setConfirmationModal] = useState<typeof DeleteConfirmationModal | null>(null)
  const [jobId, setJobId] = useState<string>();
  const [jobType, setJobType] = useState<JobType>(JobType.LLMS);
  const [name, setName] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [createdAt, setCreatedAt] = useState('');
  const [lastUdatedAt, setLastUpdatedAt] = useState('');
  const [ragIngestionStatus, setRagIngestionStatus] = useState<RagIngestionStatus>(RagIngestionStatus.NOT_STARTED);
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdate, setIsUpdate] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [alerts, setAlerts] = useState<typeof Alert[]>([])
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (path.endsWith('/create')) {
        if (!jobId && isLoading) {
          // Check if there's a cached jobId
          const cachedJobId = await Cache.getItem('current_job_id');
          
          if (cachedJobId) {
            setJobId(cachedJobId);
            console.log('retrieved cached jobId: ' + cachedJobId);
          } else {
            const newJobId = uuidv4();
            setJobId(newJobId);
            // Save to cache
            Cache.setItem('current_job_id', newJobId);
            console.log('created new jobId: ' + newJobId);
          }
          setIsUpdate(false);
          setIsLoading(false);
        }
      }
      else {
        if (path.endsWith('/edit') || path.endsWith('/delete')) {
          console.log("This is an update or delete.")
          setIsUpdate(true)
          if (!jobId && isLoading) {
              setJobId(urlParams.id ?? '');
              setIsLoading(false);
          }
        }
      }
    })()
  }, [])

  useEffect(() => {
    if (path.endsWith('/delete') && name) {
      confirmDeleteJob(name)
    }
  },[name])

  useEffect(() => {
    if (jobId) {
      console.log(`got jobId ${jobId}`)
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (jobType) {
      console.log(`Got new jobType ${jobType}`)
    }
  },[jobType])
  // useEffect(() => {
  //   console.log("params updated:")
  //   console.dir(params)
  //   if (params && params?.id) {
  //     console.log('params.id: ' + params.id)
  //     setUrlJobId(params.id)
  //   }
  // }, [params])
  
  useEffect(() => {
    (async () => {
      if (jobId && isUpdate) {
        console.log(`got jobId ${jobId} for update`);
        try {
          const jobData = await GetJob(jobId);
          if (jobData) {
            setName(jobData.name || '');
            setJobType(jobData.jobType);
            setSelectedModels(jobData.selectedModels ? JSON.parse(jobData.selectedModels) : []);
            setCreatedAt(jobData.createdAt || '');
            setLastUpdatedAt(jobData.lastUpdatedAt || '');
            setRagIngestionStatus(jobData.ragIngestionStatus);
          }
        } catch (error) {
          console.error('Error fetching job data:', error);
        }
        setIsLoading(false);
      } else if (jobId) {
        console.log(`got jobId ${jobId}`);
        setIsLoading(false)
      }
    })()
  }, [jobId])

  // useEffect( () => {
  //   // const onBeforeUnload = (ev) => {
  //   //   setCurrentCollection({})
  //   //   setUrlJobId(null)
  //   //   setCollectionShareList(null)
  //   //   setCurrentPageIndex(0)
  //   //   setLastEvalKey('')
  //   // };
  //   // window.addEventListener("beforeunload", onBeforeUnload);
  //   const deleteConfMsg = defaultDeleteConfirmationMessage.replace('{currentCollection.name}', currentCollection.name)
  //   setDeleteConfirmationMessage(deleteConfMsg)
  //   checkEnableSubmit()
  //   // return () => {
  //   //   window.removeEventListener("beforeunload", onBeforeUnload);
  //   // };
  // }, [currentCollection])

  // function checkEnableSubmit() {
  //   if (currentCollection && currentCollection.name !== '' && 
  //      currentCollection.description !== '') {
  //     setSubmitDisabled(false);
  //   }
  //   else {
  //     setSubmitDisabled(true)
  //   }
  // }

  // function confirmDeleteCollection(evt) {
  //   // console.log(`confirming delete collection ${urlJobId}`)
  //   setConfirmationModal(
  //     <DeleteConfirmationModal
  //       message={deleteConfirmationMessage}
  //       deleteFn={deleteCollection}
  //       deleteRedirectLocation={'#/document-collections'}
  //       resourceId={urlJobId}
  //       visible={true}
  //     />
  //   )
  //   setDeleteModalVisible(true)
  //   // api.deleteDocCollection(evt.urlJobId)
  // }
  
  // function deleteCollection(collectionId) {
  //   api.deleteDocCollection(collectionId)
  //   setDeleteModalVisible(false)
  // }

  function confirmDeleteJob(name: string) {
    // console.log('confirmDeleteFile received event')
    // console.dir(selectedFileUpload)
    // console.log(`confirming delete file ${selectedFileUpload['file_name']}`)
    setConfirmationModal(
      <DeleteConfirmationModal
        message={createDeleteMessage(name)}
        confirmationCallback={deleteJob}
        // deleteRedirectLocation={window.location.href}
        visible={true}
      />
    )
    setDeleteModalVisible(true)
    // evt.preventDefault()
  }


  function createDeleteMessage(jobName: string) {
      let messages = (
        <>
          <p>Are you sure you want to delete this job?</p>
          <p>Job Name: {jobName}</p>
        </>
      );
      return messages;
  }

  async function deleteJob() {
    if (jobId) {
      await DeleteJob(jobId)
      setDeleteModalVisible(false)
      setConfirmationModal(null)
      window.location.hash = '#/jobs'
    }
    // setTableReload(true)
    // setIsLoading(true)
    // reloadTable(evt)
    // evt.preventDefault()
  }
  function getLoadingPageContent() {
    return (
      <>
        <div style={{textAlign: "center"}}>
          Loading<br/>
          <Spinner size="large"/>
        </div>
      </>
    )
  }

  function hideAlerts() {
    setAlerts([])
  }
  
  // Helper function to render model selection based on job type
  const ModelSelection = () => {
    if (!jobType) return null;
    
    const modelType = jobType === 'LLMS' ? 'llms' : 'embeddings';
    const models = config[modelType];
    
    if (!models) return null;
    
    const handleModelSelect = (modelName: string) => {
      if (selectedModels.includes(modelName)) {
        setSelectedModels(selectedModels.filter(model => model !== modelName));
      } else {
        setSelectedModels([...selectedModels, modelName]);
      }
    };
    
    return (
      <FormField key='modelSelection' label="Available Models">
        <Container>
          <SpaceBetween direction="vertical" size="l">
            {Object.keys(models).map(provider => (
              <div key={provider}>
                <Box variant="h5">{provider.charAt(0).toUpperCase() + provider.slice(1)}</Box>
                <SpaceBetween direction="vertical" size="xs">
                  {Object.keys(models[provider])
                    .filter(key => key !== 'openai_key')
                    .map(model => (
                      <Checkbox
                        key={model}
                        checked={selectedModels.includes(model)}
                        onChange={() => handleModelSelect(model)}
                        disabled={isUpdate}
                      >
                        {model}
                      </Checkbox>
                    ))
                  }
                </SpaceBetween>
              </div>
            ))}
          </SpaceBetween>
        </Container>
      </FormField>
    );
  };

  function getPageContent() {

    return (
      <>
        {alerts}
        <form onSubmit={e => {
          e.preventDefault();
          sendData(e);
        }}>
        <Form className="JobForm"
          actions={
            <SpaceBetween key="sb0" direction="horizontal" size="xs">
              <Button formAction="cancel" variant="link">
                Cancel
              </Button>
              <Button 
                formAction='submit'
                loading={isLoading}
                variant="primary"
                onClick={sendData}
                disabled={isUpdate}
              >Save</Button>
            </SpaceBetween>
          }>
          <Container>
            <SpaceBetween key="sb1" direction="vertical" size="l">
              <FormField key='name' label="Job Name">
              <Input
                key='name'
                onChange={({ detail }) => setName(detail.value)}
                value={name ?? ''}
                disabled={isUpdate}
              />
              </FormField>
              
              <FormField key='jobType' label="Job Type">
                <RadioGroup
                  onChange={({ detail }) => setJobType(detail.value)}
                  value={jobType}
                  items={[
                    { value: "LLMS", label: "LLMs" },
                    { value: "EMBEDDINGS", label: "Embeddings" }
                  ]}
                  readOnly={isUpdate}
                />
              </FormField>
              
              {jobType && <ModelSelection />}
              
              <Tabs
                tabs={[
                  {
                    label: "Upload Documents",
                    id: "upload",
                    content: (
                      <Container>
                        <SpaceBetween size="l">
                          {jobId && <UploadedDocumentsTable isUpdate={isUpdate} jobId={jobId}/>}
                        </SpaceBetween>
                      </Container>
                    )
                  }
                ]}
              />
            </SpaceBetween>
          </Container>
        </Form>
      </form>
      {confirmationModal}
    </>)
  }
  async function sendData(evt: FormEvent<HTMLFormElement>){
    evt.preventDefault()
    // setIsLoading(true)
    try {
      // Create a new job using the Job object
      const jobProps: JobProps = {
        id: jobId,
        jobType: jobType !== null ? jobType : JobType.LLMS,
        // userId: 'current-user', // This would typically come from authentication
        name: name,
        selectedModels: JSON.stringify(selectedModels),
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        files: [],
        ragIngestionStatus: RagIngestionStatus.NOT_STARTED,
        ragIngestionStatusMessage: '',
        evalDatasetGenerationStatus: EvalDatasetGenerationStatus.NOT_STARTED,
        evalDatasetGenerationStatusMessage: '',
        evalDatasetApprovalStatus: EvalDatasetApprovalStatus.NOT_STARTED,
        evalDatasetApprovalStatusMessage: '',
        evalStatus: EvalStatus.NOT_STARTED,
        evalStatusMessage: ''
      };
      console.log('job props')
      console.dir(jobProps)
      if (isUpdate) {
        const response = await UpdateJob(jobProps);
        console.log("Job update response:", response);
      }
      else {
        const response = await CreateJob(jobProps);
        console.log("Job creation response:", response);
      }
      // Create JobFile records for uploaded files
      if (jobId !== undefined) {
        for (const file of uploadedFiles) {
          const jobFileProps: JobFileProps = {
            name: file.key,
            ingestionStatus: 'NOT_STARTED',
            vectorizationStatus: 'NOT_STARTED',
            jobId: jobId
          };
          await CreateJobFile(jobFileProps);
        }
      }
      
      // Clear the cached jobId since job was created successfully
      Cache.removeItem('current_job_id');
      
      // Redirect to the job details page
      // if (!isUpdate) {
      location.hash = `#/jobs/${jobId}/edit`;
      setAlerts(
        <Alert
          dismissible
          statusIconAriaLabel="Success"
          type="success"
          onDismiss={hideAlerts}
        >
          Your instance has been created successfully.
        </Alert>
      )
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' // Optional: for smooth scrolling animation
      });
      setIsUpdate(true)
      // }
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // async function updateCurrentCollection(key, value) {
  //   let tmp = {}
  //   if (typeof(currentCollection) == Job) {
  //     tmp = currentCollection.clone()
  //   }
  //   else {
  //     tmp = JSON.parse(JSON.stringify(currentCollection))
  //   }
  //   tmp[key] = value
  //   setCurrentCollection(tmp)
  // }

  // async function updateDocCollectionEnrichmentPipelines(pipelines) {
  //   let tmp = JSON.parse(JSON.stringify(currentCollection))
  //   tmp.enrichment_pipelines = pipelines
  //   setCollection(tmp)
  //   console.log("DocumentCollectionForm updating currentCollection to")
  //   console.dir(tmp)
  //   console.dir(pipelines)
  //   setDocCollectionEnrichmentPipelines(pipelines)
  // }

  // async function updatePageIndex(indexNum) {
  //   // console.log(`updatePageIndex setting currentPageIndex to ${indexNum}`)
  //   let lastKey = ''
  //   if (indexNum > currentPageIndex) {
  //     // page up
  //   }
  //   else {
  //     // page down
  //   }
  //   setCurrentPageIndex(indexNum)
  //   // let tmpFiles = await getTableProvider(urlJobId, filePageSize, uploadedFiles.splice(-1)['file_name'])
  //   // // console.log("Got uploadedFiles:")
  //   // // console.dir(tmpFiles)
  //   // // console.log("Got uploadedFiles:")
  //   // // console.dir(uploadedFiles)
  //   // // console.log(`lastEval record `)
  //   // // console.dir(uploadedFiles['files'].splice(-1))
  //   // setLastEvalKey(uploadedFiles['files'].splice(-1)['file_name'])
  //   // setUploadedFiles(uploadedFiles['files'])
  // }

  return (
    <>
      { isLoading ? getLoadingPageContent() : getPageContent() }
    </>
  );
}

export default JobForm;