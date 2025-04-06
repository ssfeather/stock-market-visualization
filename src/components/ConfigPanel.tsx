import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { API_CONFIG } from '../config/api';

interface ConfigPanelProps {
  onConfigUpdate: (newConfig: typeof API_CONFIG) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState(API_CONFIG);
  const [openKeyDialog, setOpenKeyDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [editingKey, setEditingKey] = useState({ key: '', description: '' });
  const [editingStock, setEditingStock] = useState({ symbol: '', name: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleAddKey = () => {
    if (!editingKey.key || !editingKey.description) {
      setSnackbar({ open: true, message: '请填写完整的API密钥信息', severity: 'error' });
      return;
    }

    const newConfig = { ...config };
    if (editingIndex !== null) {
      newConfig.ALPHA_VANTAGE.KEYS[editingIndex] = editingKey;
    } else {
      newConfig.ALPHA_VANTAGE.KEYS.push(editingKey);
    }
    
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    setOpenKeyDialog(false);
    setEditingKey({ key: '', description: '' });
    setEditingIndex(null);
    setSnackbar({ open: true, message: '成功保存API密钥', severity: 'success' });
  };

  const handleAddStock = () => {
    if (!editingStock.symbol || !editingStock.name) {
      setSnackbar({ open: true, message: '请填写完整的股票信息', severity: 'error' });
      return;
    }

    const newConfig = { ...config };
    if (editingIndex !== null) {
      newConfig.STOCKS.COMMON_STOCKS[editingIndex] = editingStock;
    } else {
      newConfig.STOCKS.COMMON_STOCKS.push(editingStock);
    }
    
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    setOpenStockDialog(false);
    setEditingStock({ symbol: '', name: '' });
    setEditingIndex(null);
    setSnackbar({ open: true, message: '成功保存股票信息', severity: 'success' });
  };

  const handleSaveToFile = async () => {
    try {
      // 格式化配置对象为字符串
      const configString = `export const API_CONFIG = ${JSON.stringify(config, null, 2)};`;
      
      // 发送到后端保存
      const response = await fetch('http://localhost:3001/api/saveConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: configString }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: '配置已成功保存到文件', severity: 'success' });
        
        // 重新加载页面以应用新配置
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存配置文件失败:', error);
      setSnackbar({ 
        open: true, 
        message: `保存配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        severity: 'error' 
      });
    }
  };

  const handleEditKey = (index: number) => {
    setEditingKey(config.ALPHA_VANTAGE.KEYS[index]);
    setEditingIndex(index);
    setOpenKeyDialog(true);
  };

  const handleEditStock = (index: number) => {
    setEditingStock(config.STOCKS.COMMON_STOCKS[index]);
    setEditingIndex(index);
    setOpenStockDialog(true);
  };

  const handleDeleteKey = (index: number) => {
    const newConfig = { ...config };
    newConfig.ALPHA_VANTAGE.KEYS.splice(index, 1);
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    setSnackbar({ open: true, message: '成功删除API密钥', severity: 'success' });
  };

  const handleDeleteStock = (index: number) => {
    const newConfig = { ...config };
    newConfig.STOCKS.COMMON_STOCKS.splice(index, 1);
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    setSnackbar({ open: true, message: '成功删除股票', severity: 'success' });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">配置管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveToFile}
        >
          保存到文件
        </Button>
      </Box>

      {/* API Keys 管理 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">API Keys</Typography>
          <Button 
            variant="contained" 
            onClick={() => {
              setEditingKey({ key: '', description: '' });
              setEditingIndex(null);
              setOpenKeyDialog(true);
            }}
          >
            添加API Key
          </Button>
        </Box>
        <List>
          {config.ALPHA_VANTAGE.KEYS.map((key, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={key.description}
                secondary={key.key}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEditKey(index)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteKey(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* 股票代码管理 */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">股票列表</Typography>
          <Button 
            variant="contained"
            onClick={() => {
              setEditingStock({ symbol: '', name: '' });
              setEditingIndex(null);
              setOpenStockDialog(true);
            }}
          >
            添加股票
          </Button>
        </Box>
        <List>
          {config.STOCKS.COMMON_STOCKS.map((stock, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={`${stock.symbol} - ${stock.name}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEditStock(index)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteStock(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* API Key 编辑对话框 */}
      <Dialog open={openKeyDialog} onClose={() => setOpenKeyDialog(false)}>
        <DialogTitle>{editingIndex !== null ? '编辑API Key' : '添加API Key'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="API Key"
            fullWidth
            value={editingKey.key}
            onChange={(e) => setEditingKey({ ...editingKey, key: e.target.value })}
          />
          <TextField
            margin="dense"
            label="描述"
            fullWidth
            value={editingKey.description}
            onChange={(e) => setEditingKey({ ...editingKey, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKeyDialog(false)}>取消</Button>
          <Button onClick={handleAddKey}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 股票编辑对话框 */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)}>
        <DialogTitle>{editingIndex !== null ? '编辑股票' : '添加股票'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="股票代码"
            fullWidth
            value={editingStock.symbol}
            onChange={(e) => setEditingStock({ ...editingStock, symbol: e.target.value })}
          />
          <TextField
            margin="dense"
            label="股票名称"
            fullWidth
            value={editingStock.name}
            onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockDialog(false)}>取消</Button>
          <Button onClick={handleAddStock}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ConfigPanel; 