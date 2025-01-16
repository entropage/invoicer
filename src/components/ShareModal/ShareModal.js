// @flow
import * as React from 'react';
import { useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { useSnackbar } from '../Snackbar/useSnackbar';

type Props = {
    open: boolean,
    onClose: () => void,
    invoiceId: string,
};

export function ShareModal({ open, onClose, invoiceId }: Props) {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();

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
                onClose();
            } else {
                showSnackbar(data.error || 'Failed to share invoice', 'error');
            }
        } catch (error) {
            showSnackbar('An error occurred while sharing', 'error');
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
                />
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
