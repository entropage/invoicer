// @flow
import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSnackbar } from '../Snackbar/useSnackbar';

type Props = {
    open: boolean,
    onClose: () => void,
    invoiceId: string,
};

export function ShareModal({ open, onClose, invoiceId }: Props) {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [sharedUsers, setSharedUsers] = useState([]);
    const { showSnackbar } = useSnackbar();

    // Fetch current share status when modal opens
    useEffect(() => {
        if (open && invoiceId) {
            fetchSharedUsers();
        }
    }, [open, invoiceId]);

    const fetchSharedUsers = async () => {
        try {
            const response = await fetch(`/api/invoice/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok && data.accessList) {
                setSharedUsers(data.accessList);
            }
        } catch (error) {
            showSnackbar('Failed to fetch shared users', 'error');
        }
    };

    const handleShare = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/invoice/${invoiceId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar('Invoice shared successfully', 'success');
              setUserId('');
              fetchSharedUsers();  // Refresh the list
            } else {
                showSnackbar(data.error || 'Failed to share invoice', 'error');
            }
        } catch (error) {
            showSnackbar('An error occurred while sharing', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnshare = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/invoice/${invoiceId}/share`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (response.ok) {
                showSnackbar('Share access removed successfully', 'success');
                fetchSharedUsers();  // Refresh the list
            } else {
                showSnackbar(data.error || 'Failed to remove share access', 'error');
            }
        } catch (error) {
            showSnackbar('An error occurred while removing access', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Share Invoice</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="User ID"
                    fullWidth
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    helperText="Enter the ID of the user to share with"
                    disabled={loading}
                />

                {/* Show current shares */}
                {sharedUsers.length > 0 && (
                    <>
                        <h4 style={{ marginTop: 20, marginBottom: 10 }}>Currently Shared With:</h4>
                        <List>
                            {sharedUsers.map((user) => (
                                <ListItem key={user._id}>
                                    <ListItemText
                                        primary={user.username}
                                        secondary={`Role: ${user.role}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="unshare"
                                            onClick={() => handleUnshare(user._id)}
                                            disabled={loading}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <CircularProgress />
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleShare}
                    color="primary"
                    variant="contained"
                    disabled={loading || !userId}
                >
                    Share
                </Button>
            </DialogActions>
        </Dialog>
    );
}
