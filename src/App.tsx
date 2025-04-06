import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import StockChart from './components/StockChart';
import ConfigPanel from './components/ConfigPanel';
import { API_CONFIG } from './config/api';

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
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [config, setConfig] = useState(API_CONFIG);

  const handleConfigUpdate = (newConfig: typeof API_CONFIG) => {
    setConfig(newConfig);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="股票图表" />
          <Tab label="配置管理" />
        </Tabs>
      </Box>
      <TabPanel value={currentTab} index={0}>
        <StockChart config={config} />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <ConfigPanel onConfigUpdate={handleConfigUpdate} />
      </TabPanel>
    </Box>
  );
}

export default App;
