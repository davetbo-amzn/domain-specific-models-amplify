import { useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';

// This will be replaced with actual data from a JSON file
const mockModelData = {
  embedding: {
    bedrock: {
      "amazon-titan-embed": { maxTokens: 8192, dimensions: 1536 },
      "cohere-embed": { maxTokens: 4096, dimensions: 768 }
    },
    sagemaker: {
      "sm-embedding-1": { maxTokens: 8192, dimensions: 1024 },
      "sm-embedding-2": { maxTokens: 4096, dimensions: 512 }
    },
    openai: {
      "text-embedding-ada-002": { maxTokens: 8191, dimensions: 1536 }
    },
    custom: {
      "custom-embedding-1": { maxTokens: 2048, dimensions: 384 }
    }
  },
  llm: {
    bedrock: {
      "amazon-titan": { maxTokens: 8192, temperature: "0.0-1.0" },
      "anthropic-claude-3": { maxTokens: 100000, temperature: "0.0-1.0" }
    },
    sagemaker: {
      "sm-llama-2": { maxTokens: 4096, temperature: "0.0-2.0" },
      "sm-falcon": { maxTokens: 2048, temperature: "0.0-1.0" }
    },
    openai: {
      "gpt-4": { maxTokens: 8192, temperature: "0.0-2.0" },
      "gpt-3.5-turbo": { maxTokens: 4096, temperature: "0.0-2.0" }
    },
    custom: {
      "custom-llm-1": { maxTokens: 2048, temperature: "0.0-1.0" }
    }
  }
};

type ModelSelection = {
  [modelId: string]: boolean;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const { signOut } = useAuthenticator();
  const [jobType, setJobType] = useState<string>("");
  const [jobName, setJobName] = useState<string>("");
  const [jobs, setJobs] = useState<Array<any>>([]);
  const [selectedModels, setSelectedModels] = useState<ModelSelection>({});
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('TabChange handled:');
    console.dir(event);
    setTabValue(newValue);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const handleCreateJob = () => {
    if (jobName && jobType) {
      const selectedModelIds = Object.keys(selectedModels).filter(id => selectedModels[id]);
      
      if (selectedModelIds.length === 0) {
        alert("Please select at least one model");
        return;
      }
      
      const newJob = {
        id: Date.now().toString(),
        name: jobName,
        type: jobType,
        models: selectedModelIds,
        status: "Pending",
        createdAt: new Date().toISOString()
      };
      
      setJobs([...jobs, newJob]);
      setJobName("");
      setSelectedModels({});
    }
  };

  const renderModelsByProvider = (type: "embedding" | "llm") => {
    const providers = ["bedrock", "sagemaker", "openai", "custom"];
    
    return providers.map(provider => {
      const models = mockModelData[type][provider as keyof typeof mockModelData[typeof type]];
      
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
          
          {Object.entries(models).map(([modelId, details]) => (
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
                  {type === "embedding" ? (
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
            </Box>
          ))}
        </Paper>
      );
    });
  };

  return (
    <Box>
      <AppBar position="static" color="default" elevation={0}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Typography variant="h5" component="h1">
              Domain-Specific Model Evaluation & Customization
            </Typography>
            <Button 
              variant="outlined" 
              onClick={signOut} 
              startIcon={<LogoutIcon />}
            >
              Sign out
            </Button>
          </Box>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="job tabs">
            <Tab label="Job Creation" />
            <Tab label="Job Review" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Job Type</FormLabel>
                <RadioGroup
                  value={jobType}
                  onChange={(e) => {
                    setJobType(e.target.value);
                    setSelectedModels({});
                  }}
                >
                  <FormControlLabel value="embedding" control={<Radio />} label="Embedding Models" />
                  <FormControlLabel value="llm" control={<Radio />} label="LLMs" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {jobType && (
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {jobType === "embedding" ? "Embedding Models" : "LLM Models"} Available
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {renderModelsByProvider(jobType as "embedding" | "llm")}
                  </Box>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateJob}
                disabled={!jobName || !jobType || Object.keys(selectedModels).filter(id => selectedModels[id]).length === 0}
              >
                Create Job
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {jobs.length > 0 ? (
            <Grid container spacing={3}>
              {jobs.map(job => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card>
                    <CardHeader
                      title={job.name}
                      subheader={job.type === "embedding" ? "Embedding Model" : "LLM"}
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Status: <Chip label={job.status} color="warning" size="small" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Created: {new Date(job.createdAt).toLocaleString()}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" fontWeight="bold">
                        Selected Models ({job.models.length}):
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {job.models.map((modelId: string) => (
                          <Chip key={modelId} label={modelId} size="small" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">No jobs created yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Use the Job Creation tab to create new evaluation jobs.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;