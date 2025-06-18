import { useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import AppRoutes from './AppRoutes';
import { AppLayout, Header, SideNavigation } from '@cloudscape-design/components';

import '@aws-amplify/ui-react/styles.css';
import "@cloudscape-design/global-styles/index.css";

// import CreateJob from './pages/CreateJob';
// import ReviewJobs from './pages/ReviewJobs';

// This will be replaced with actual data from a JSON file


function App() {
  console.log('Initializing App')
  const { user, signOut } = useAuthenticator();
  console.dir(user.signInDetails?.loginId)
  return (
    <AppLayout
      content={
        <>
            <Header
                variant="h4"
            >
                Welcome, {user.signInDetails?.loginId}
            </Header>
            <AppRoutes signOut={signOut}/>
        </>
      }
      navigation={<SideNavigation 
          header={{ href: "/", text: `Domain-specific model evaluations`}} 
          items={[
              // {
              //     type: "link",
              //     text: "Logout",
              //     href: "#/logout"
              // },
              {
                
                type: "link",
                text: "Jobs",
                href: "/#/jobs"
      
              }
              // {
              //     type: "link",
              //     text: "Log out", 
              //     href: "#/logout"    
              // },
          ]}
      />}
    >
    </AppLayout>
  );
}

export default App;