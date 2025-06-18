// import type { Schema } from '../../amplify/data/resource';
import { useEffect, useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import config from '../config.json'
import aws_config from '../../amplify_outputs.json';
import { FileUploader } from '@aws-amplify/ui-react-storage';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
    Box,
    Button,
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { v4 as uuidv4 } from 'uuid';
import { Schema } from 'aws-amplify/datastore';
import '@aws-amplify/ui-react/styles.css';

type ModelSelection = {
  [modelId: string]: boolean;
};

const client = generateClient<Schema>();

// enum JobType {
//     EMBEDDING = "embedding",
//     LLM = "llm"
// }

export default function CreateJob() {
    const jobId = uuidv4();
    const [jobType, setJobType] = useState<string>("");
    const [jobName, setJobName] = useState<string>("");
    const [jobs, setJobs] = useState<Array<any>>([]);
    const [selectedModels, setSelectedModels] = useState<ModelSelection>({});
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleModelSelect = (modelId: string) => {
        setSelectedModels((prev: { [x: string]: any; }) => ({
          ...prev,
          [modelId]: !prev[modelId]
        }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            console.log('Got newFiles in handleFileChange:')
            console.dir(newFiles);
            let tmpFiles = [...files, ...newFiles];
            setFiles(tmpFiles);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(files => files.filter((_, i) => i !== index));
    };

    const [isUploading, setIsUploading] = useState(false);

    // const uploadFileToS3 = async (file: File, jobId: string) => {
    //   try {
    //     const path = `${jobId}/${file.name}`;
    //     console.log(`Uploading file ${file.name} to S3 with key ${path}`);      
        
    //     const result = await uploadData({
    //       path: path,
    //       data: file,
    //       options: {
    //         accessLevel: 'private',
    //         contentType: file.type
    //       }
    //     });
    //     return result;
    //   } catch (error) {
    //     console.error(`Error uploading file ${file.name}:`, error);
    //     throw error;
    //   }
    // };

    const handleCreateJob = async () => {
        if (jobName && jobType) {
          const selectedModelIds = Object.keys(selectedModels).filter(id => selectedModels[id]);
          if (selectedModelIds.length === 0) {
            alert("Please select at least one model");
            return;
          }
          
          if (files.length === 0) {
            alert("Please upload at least one file");
            return;
          }
          
          setIsUploading(true);
          
          try {
            //const jobId = Date.now().toString();
            const uploadPromises = files.map(file => uploadFileToS3(file, jobId));
            const uploadResults = await Promise.all(uploadPromises);
            
            // Create file metadata with S3 keys
            const fileMetadata = files.map((file, index) => ({
              name: file.name,
              size: file.size,
              type: file.type,
              s3Key: uploadResults[index].key
            }));
            
            const newJob = {
              id: jobId,
              name: jobName,
              type: jobType,
              models: selectedModelIds,
              fileMetadata: fileMetadata,
              status: "Pending",
              createdAt: new Date().toISOString()
            };
            
            console.log("Job created with uploaded files:", newJob);
            setJobs([...jobs, newJob]);
            setJobName("");
            setSelectedModels({});
            setFiles([]);
          } catch (error) {
            console.error("Error creating job:", error);
            alert("Failed to upload files. Please try again.");
          } finally {
            setIsUploading(false);
          }
        }
    };

    const renderModelsByProvider = (type: "embeddings" | "llms") => {
          const providers = ["bedrock", "sagemaker", "openai", "custom"];
          console.log(`Got config type ${type}`)
          console.dir(config)
          console.dir(config[type])
          return providers.map(provider => {
            console.log('got models:')
            // console.dir(config[type][provider])
            // Get provider data and filter out non-object values like API keys
            const providerData = config[type]?.[provider as keyof typeof config[typeof type]] || {};
            // Filter out non-object values (like API keys) and create a properly typed object
            const models: Record<string, Record<string, any>> = Object.entries(providerData)
              .filter(([_, value]) => typeof value === 'object' && value !== null)
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
            if (!models || Object.keys(models).length === 0) return null;
            
            return (
              <Paper key={provider} elevation={1} sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  <Chip 
                    label={Object.keys(models).length} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
                
                {Object.entries(models).map(([modelId, details]) => {
                  if (['openai_key'].includes(modelId)) return null;
                  else return (
                  <Box key={modelId} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedModels[modelId]}
                          onChange={() => handleModelSelect(modelId)}
                        />
                      }
                      label=""
                      sx={{ mr: 0 }}
                    />
                    <Accordion sx={{ width: '100%' }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel-${modelId}-content`}
                        id={`panel-${modelId}-header`}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <Typography fontWeight="bold">{modelId}</Typography>
                          <Chip 
                            label={selectedModels[modelId] ? "Selected" : "Available"} 
                            color={selectedModels[modelId] ? "success" : "primary"} 
                            size="small" 
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {type === "embeddings" ? (
                          <>
                            <Typography>Dimensions: {(details as any).dimensions}</Typography>
                            <Typography>Max Tokens: {(details as any).maxTokens}</Typography>
                          </>
                        ) : (
                          <>
                            <Typography>Temperature Range: {(details as any).temperature}</Typography>
                            <Typography>Max Tokens: {(details as any).maxTokens}</Typography>
                          </>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Box>)
                })}
              </Paper>
            );
          });
        };
      
    return (
        <>
            <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Name"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter a name for this evaluation job"
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Upload Files
              </Typography>
              {/* <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              /> */}
               <FileUploader
                acceptedFileTypes={['application/jsonl']}
                path={({ identityId }) => `private/${identityId}/${jobId}/`}
                maxFileCount={1000}
                isResumable
              />
              {/* <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 2 }}
              >
                Upload Files
              </Button> */}
              {files.length > 0 && (
                <List>
                  {files.map((file, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveFile(index)}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(2)} KB`} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Job Type</FormLabel>
                <RadioGroup
                  value={jobType}
                  onChange={(e) => {
                    setJobType(e.target.value);
                    setSelectedModels({});
                  }}
                >
                  <FormControlLabel value="embeddings" control={<Radio />} label="Embedding Models" />
                  <FormControlLabel value="llms" control={<Radio />} label="LLMs" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {jobType && (
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {jobType === "embeddings" ? "Embedding Models" : "LLM Models"} Available
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {renderModelsByProvider(jobType as "embeddings" | "llms")}
                  </Box>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateJob}
                disabled={!jobName || !jobType || Object.keys(selectedModels).filter(id => selectedModels[id]).length === 0 || isUploading}
              >
                {isUploading ? 'Uploading Files...' : 'Create Job'}
              </Button>
            </Grid>
          </Grid>
        </>
    )
}
