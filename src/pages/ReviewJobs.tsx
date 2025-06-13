import { Grid, Card, Divider } from '@aws-amplify/ui-react'
import { CardHeader, CardContent, Typography, Chip, Box } from '@mui/material'
import type { Schema } from '../../amplify/data/resource'
import { generateClient } from 'aws-amplify/data'
import { useState } from 'react'

const client = generateClient<Schema>()

export default function ReviewJobs() {
  const [jobs, setJobs] = useState<Array<any>>([]);

  return (
    <>
      {jobs.length > 0 ? (
        <Grid container spacing={3}>
          {jobs.map(job => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardHeader
                  title={job.name}
                  subheader={job.type === "s" ? "Embedding Model" : "LLM"}
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
    </>
  )
}