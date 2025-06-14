import { useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Typography} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';

import CreateJob from './pages/CreateJob';
// import ReviewJobs from './pages/ReviewJobs';

// This will be replaced with actual data from a JSON file


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
  // const [jobType, setJobType] = useState<string>("");
  // const [jobName, setJobName] = useState<string>("");
  // const [jobs, setJobs] = useState<Array<any>>([]);
  // const [selectedModels, setSelectedModels] = useState<ModelSelection>({});
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // console.log('TabChange handled:');
    // console.dir(event);
    setTabValue(newValue);
  };

  // const handleModelSelect = (modelId: string) => {
  //   setSelectedModels(prev => ({
  //     ...prev,
  //     [modelId]: !prev[modelId]
  //   }));
  // };

  // const handleCreateJob = () => {
  //   if (jobName && jobType) {
  //     const selectedModelIds = Object.keys(selectedModels).filter(id => selectedModels[id]);
      
  //     if (selectedModelIds.length === 0) {
  //       alert("Please select at least one model");
  //       return;
  //     }
      
  //     const newJob = {
  //       id: Date.now().toString(),
  //       name: jobName,
  //       type: jobType,
  //       models: selectedModelIds,
  //       status: "Pending",
  //       createdAt: new Date().toISOString()
  //     };
      
  //     setJobs([...jobs, newJob]);
  //     setJobName("");
  //     setSelectedModels({});
  //   }
  // };

  // const renderModelsByProvider = (type: "embedding" | "llm") => {
  //   const providers = ["bedrock", "sagemaker", "openai", "custom"];
    
  //   return providers.map(provider => {
  //     const models = mockModelData[type][provider as keyof typeof mockModelData[typeof type]];
      
  //     if (!models || Object.keys(models).length === 0) return null;
      
  //     return (
  //       <Paper key={provider} elevation={1} sx={{ mb: 2, p: 2 }}>
  //         <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  //           {provider.charAt(0).toUpperCase() + provider.slice(1)}
  //           <Chip 
  //             label={Object.keys(models).length} 
  //             color="primary" 
  //             size="small" 
  //             sx={{ ml: 1 }} 
  //           />
  //         </Typography>
          
  //         {Object.entries(models).map(([modelId, details]) => (
  //           <Box key={modelId} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
  //             <FormControlLabel
  //               control={
  //                 <Checkbox
  //                   checked={!!selectedModels[modelId]}
  //                   onChange={() => handleModelSelect(modelId)}
  //                 />
  //               }
  //               label=""
  //               sx={{ mr: 0 }}
  //             />
  //             <Accordion sx={{ width: '100%' }}>
  //               <AccordionSummary
  //                 expandIcon={<ExpandMoreIcon />}
  //                 aria-controls={`panel-${modelId}-content`}
  //                 id={`panel-${modelId}-header`}
  //               >
  //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
  //                   <Typography fontWeight="bold">{modelId}</Typography>
  //                   <Chip 
  //                     label={selectedModels[modelId] ? "Selected" : "Available"} 
  //                     color={selectedModels[modelId] ? "success" : "primary"} 
  //                     size="small" 
  //                   />
  //                 </Box>
  //               </AccordionSummary>
  //               <AccordionDetails>
  //                 {type === "embedding" ? (
  //                   <>
  //                     <Typography>Dimensions: {(details as any).dimensions}</Typography>
  //                     <Typography>Max Tokens: {(details as any).maxTokens}</Typography>
  //                   </>
  //                 ) : (
  //                   <>
  //                     <Typography>Temperature Range: {(details as any).temperature}</Typography>
  //                     <Typography>Max Tokens: {(details as any).maxTokens}</Typography>
  //                   </>
  //                 )}
  //               </AccordionDetails>
  //             </Accordion>
  //           </Box>
  //         ))}
  //       </Paper>
  //     );
  //   });
  // };

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
          <CreateJob/>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* <ReviewJobs/> */}
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;