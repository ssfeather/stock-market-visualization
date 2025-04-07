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
import { API_CONFIG } from '../config/api';

interface ConfigPanelProps {
  onConfigUpdate: (newConfig: typeof API_CONFIG) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState(API_CONFIG);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [editingStock, setEditingStock] = useState({ symbol: '', name: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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

  const handleEditStock = (index: number) => {
    setEditingStock(config.STOCKS.COMMON_STOCKS[index]);
    setEditingIndex(index);
    setOpenStockDialog(true);
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
      <Typography variant="h5" sx={{ mb: 3 }}>股票列表管理</Typography>

      {/* 股票代码管理 */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">常用股票</Typography>
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
                primary={stock.name}
                secondary={stock.symbol}
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

      {/* 股票编辑对话框 */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)}>
        <DialogTitle>
          {editingIndex !== null ? '编辑股票' : '添加股票'}
        </DialogTitle>
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
          <Button onClick={handleAddStock} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ConfigPanel; 