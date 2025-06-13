import { defineStorage } from '@aws-amplify/backend';

export const jobsInputBucket = defineStorage({
  name: 'JobsInputFiles',
  access: (allow) => ({
    'private/{entity_id}/*': [
        allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});

export const jobsOutputBucket = defineStorage({
    name: 'JobsOutputFiles',
    access: (allow) => ({
      'private/{entity_id}/*': [
          allow.entity('identity').to(['read', 'write', 'delete'])
      ]
    })
});