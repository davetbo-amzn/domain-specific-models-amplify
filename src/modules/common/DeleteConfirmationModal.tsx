//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0

import { useState, useEffect } from 'react'
import { Box, Button, FormField, Input, Modal, SpaceBetween, } from '@cloudscape-design/components'

function DeleteConfirmationModal(props: {
    message: any; 
    visible: any; 
    confirmationCallback: any; 
    // deleteRedirectLocation: any; 
    // evt: any 
}) {
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deleteDisabled, setDeleteDisabled] = useState(true)
    const [message] = useState(props.message)
    const [deleteModalVisible, setDeleteModalVisible] = useState(props.visible)
    const confirmationCallback = props.confirmationCallback
    // const deleteRedirectLocation = props.deleteRedirectLocation
    // const [evt] = useState(props.evt)

    useEffect(() => {
        if (deleteConfirmation == 'confirm') {
          setDeleteDisabled(false)
        }
        else {
          setDeleteDisabled(true)
        }
      }, [deleteConfirmation])

    // const executeDelete = () => {
    //     setIsDeleting(true)
    //     // console.log('Delete clicked. EVT:')
    //     // console.dir(evt)
    //     deleteFn(resourceId, evt)
    //     setIsDeleting(false)
    //     setDeleteModalVisible(false)
    //     location.href = deleteRedirectLocation
    // }

    return (
        <Modal
            visible={deleteModalVisible}
            onDismiss={() => setDeleteModalVisible(false)}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    onClick={() => {
                      window.location.hash = '#/jobs';
                      setDeleteModalVisible(false);
                    }}
                    variant="link"
                  >Cancel</Button>
                  <Button 
                    onClick={confirmationCallback}
                    disabled={deleteDisabled} 
                    variant="primary"
                  >
                    Delete
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header={message}
          >
            <FormField
              label="Please type 'confirm' to confirm deletion."
            >
              <Input 
                type="text"
                placeholder="Type 'confirm' to confirm deletion."
                value={deleteConfirmation}
                onChange={({ detail }) => {
                  setDeleteConfirmation(detail.value)
                }}
              />
            </FormField>
        </Modal>
    )
}

export default DeleteConfirmationModal