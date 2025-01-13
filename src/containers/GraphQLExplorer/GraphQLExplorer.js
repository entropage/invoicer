// @flow
import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Snackbar,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

// Basic User Data IDOR
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      role
      createdAt
    }
  }
`;

// Private Data with Circular References
const GET_PRIVATE_DATA = gql`
  query GetPrivateData($id: ID!) {
    user(id: $id) {
      privateData {
        bankAccount
        taxId
        user {
          ...UserPrivateDataRecursive
        }
      }
    }
  }

  fragment UserPrivateDataRecursive on User {
    privateData {
      bankAccount
      taxId
      user {
        id
        privateData {
          bankAccount
          taxId
        }
      }
    }
  }
`;

// Admin Access
const GET_ALL_USERS = gql`
  query {
    allUsers {
      id
      username
      role
    }
  }
`;

// Invoice Access
const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      invoiceId
      items {
        description
        quantity
        unitPrice
      }
    }
  }
`;

// Mass Assignment
const SEARCH_INVOICES = gql`
  query SearchInvoices($filter: String!) {
    searchInvoices(filter: $filter) {
      invoiceId
      amountPaid
    }
  }
`;

// Profile Update
const UPDATE_PROFILE = gql`
  mutation UpdateProfile($userId: ID!, $newUsername: String!) {
    updateUserProfile(userId: $userId, newUsername: $newUsername) {
      username
    }
  }
`;

// Invoice Deletion
const DELETE_INVOICE = gql`
  mutation DeleteInvoice($invoiceId: ID!) {
    deleteInvoice(invoiceId: $invoiceId)
  }
`;

// Predictable IDs
const CREATE_PRIVATE_DATA = gql`
  mutation CreatePrivateData($userId: ID!, $data: String!) {
    createPrivateUserData(userId: $userId, data: $data) {
      id
    }
  }
`;

// Invalid ID for Error Disclosure - using a valid format but non-existent ID
const GET_INVALID_USER = gql`
  query GetInvalidUser {
    user(id: "507f1f77bcf86cd799439012") {
      username
    }
  }
`;

// Add login mutation
const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        role
      }
    }
  }
`;

export function GraphQLExplorer() {
    console.log('[GraphQLExplorer] Component rendering');

    const [userId, setUserId] = useState('');
    const [depth, setDepth] = useState(2);
    const [invoiceId, setInvoiceId] = useState('');
    const [filter, setFilter] = useState('{}');
    const [newUsername, setNewUsername] = useState('');
    const [privateData, setPrivateData] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState('');

    // Error handling helper
    const handleError = React.useCallback((error) => {
        console.error('[GraphQLExplorer] Error:', error);
        const message = error.graphQLErrors?.[0]?.message || error.message || 'An unknown error occurred';
        setErrorMessage(message);
        // Clear error after 5 seconds
        setTimeout(() => setErrorMessage(''), 5000);
    }, []);

    // Add login mutation
    const [login] = useMutation(LOGIN, {
        onCompleted: (data) => {
            console.log('[GraphQLExplorer] Login successful:', data);
            localStorage.setItem('token', data.login.token);
            const newUserId = data.login.user.id;
            console.log('[GraphQLExplorer] Setting userId to:', newUserId);
            setUserId(newUserId);
        },
        onError: handleError
    });

    // Basic User Query
    const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USER, {
        variables: { id: userId },
        skip: !userId,
        onError: handleError
    });

    // Private Data Query
    const { data: privateDataResult, loading: privateLoading } = useQuery(GET_PRIVATE_DATA, {
        variables: { id: userId },
        skip: !userId,
        onError: handleError
    });

    // Admin Access Query
    const { data: allUsersData, loading: allUsersLoading } = useQuery(GET_ALL_USERS, {
        onError: handleError
    });

    // Invoice Query
    const { data: invoiceData, loading: invoiceLoading } = useQuery(GET_INVOICE, {
        variables: { id: invoiceId },
        skip: !invoiceId,
        onError: handleError
    });

    // Mass Assignment Query
    const { data: searchData, loading: searchLoading } = useQuery(SEARCH_INVOICES, {
        variables: { filter },
        skip: !filter,
        onError: handleError
    });

    // Profile Update Mutation
    const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE, {
        onCompleted: () => setSuccess('Profile updated successfully'),
        onError: handleError
    });

    // Invoice Deletion Mutation
    const [deleteInvoice, { loading: deleteLoading }] = useMutation(DELETE_INVOICE, {
        onCompleted: () => setSuccess('Invoice deleted successfully'),
        onError: handleError
    });

    // Create Private Data Mutation
    const [createPrivateData, { loading: createLoading }] = useMutation(CREATE_PRIVATE_DATA, {
        onCompleted: () => setSuccess('Private data created successfully'),
        onError: handleError
    });

    // Error Disclosure Query - skip it until the error disclosure section is expanded
    const [isErrorSectionExpanded, setIsErrorSectionExpanded] = useState(false);
    const { error: invalidError } = useQuery(GET_INVALID_USER, {
        skip: !isErrorSectionExpanded,  // Only run query when section is expanded
        onError: handleError
    });

    // Login effect with error handling
    React.useEffect(() => {
        if (!userId) {
            console.log('[GraphQLExplorer] Attempting login...');
            login({
                variables: {
                    username: 'test',
                    password: 'test123'
                }
            }).catch(handleError);  // Add explicit error handling for the login promise
        }
    }, [userId, login, handleError]);

    // Handlers
    const handleUpdateProfile = () => {
        if (!userId || !newUsername) return;
        updateProfile({ variables: { userId, newUsername } });
    };

    const handleDeleteInvoice = () => {
        if (!invoiceId) return;
        deleteInvoice({ variables: { invoiceId } });
    };

    const handleCreatePrivateData = () => {
        if (!userId || !privateData) return;
        createPrivateData({ variables: { userId, data: privateData } });
    };

    // Loading state
    if (userLoading) {
        return (
            <Container maxWidth="lg">
                <Box py={4} display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // Error state
    if (userError) {
        return (
            <Container maxWidth="lg">
                <Box py={4}>
                    <Typography color="error">Error: {userError.message}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box py={4}>
                <Typography variant="h4" gutterBottom>
                    GraphQL Vulnerability Explorer
                </Typography>

                {/* 1. Basic User Data IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">1. Basic User Data IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="User ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                margin="normal"
                                helperText="Must be a valid MongoDB ObjectId (24 hex characters)"
                            />
                            {userLoading ? (
                                <CircularProgress />
                            ) : userData?.user && (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Username</TableCell>
                                                <TableCell>{userData.user.username}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Role</TableCell>
                                                <TableCell>{userData.user.role}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Created At</TableCell>
                                                <TableCell>{userData.user.createdAt}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 2. Private Data IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">2. Private Data IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="User ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Nesting Depth (max 10)"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                                margin="normal"
                            />
                            {privateLoading ? (
                                <CircularProgress />
                            ) : privateDataResult?.user && (
                                <pre>
                                    {JSON.stringify(privateDataResult.user.privateData, null, 2)}
                                </pre>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 3. Admin Access IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">3. Admin Access IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            {allUsersLoading ? (
                                <CircularProgress />
                            ) : allUsersData?.allUsers && (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>Username</TableCell>
                                                <TableCell>Role</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {allUsersData.allUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>{user.id}</TableCell>
                                                    <TableCell>{user.username}</TableCell>
                                                    <TableCell>{user.role}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 4. Invoice Access IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">4. Invoice Access IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="Invoice ID"
                                value={invoiceId}
                                onChange={(e) => setInvoiceId(e.target.value)}
                                margin="normal"
                            />
                            {invoiceLoading ? (
                                <CircularProgress />
                            ) : invoiceData?.invoice && (
                                <pre>
                                    {JSON.stringify(invoiceData.invoice, null, 2)}
                                </pre>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 5. Mass Assignment IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">5. Mass Assignment IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="Filter (JSON)"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                margin="normal"
                                multiline
                                rows={3}
                            />
                            {searchLoading ? (
                                <CircularProgress />
                            ) : searchData?.searchInvoices && (
                                <pre>
                                    {JSON.stringify(searchData.searchInvoices, null, 2)}
                                </pre>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 6. Profile Update IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">6. Profile Update IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="User ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="New Username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpdateProfile}
                                disabled={updateLoading}
                            >
                                Update Profile
                            </Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 7. Invoice Deletion IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">7. Invoice Deletion IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="Invoice ID"
                                value={invoiceId}
                                onChange={(e) => setInvoiceId(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleDeleteInvoice}
                                disabled={deleteLoading}
                            >
                                Delete Invoice
                            </Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 8. Predictable IDs IDOR */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">8. Predictable IDs IDOR</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <TextField
                                fullWidth
                                label="User ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Private Data"
                                value={privateData}
                                onChange={(e) => setPrivateData(e.target.value)}
                                margin="normal"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreatePrivateData}
                                disabled={createLoading}
                            >
                                Create Private Data
                            </Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* 9. Error Information Disclosure */}
                <Accordion onChange={(_, expanded) => setIsErrorSectionExpanded(expanded)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">9. Error Information Disclosure</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box width="100%">
                            <Typography variant="body1" gutterBottom>
                                This section demonstrates how detailed error messages can leak internal implementation details.
                            </Typography>
                            {invalidError && (
                                <Paper style={{ padding: 16, backgroundColor: '#fff3f3' }}>
                                    <Typography variant="h6" gutterBottom color="error">
                                        Error Details:
                                    </Typography>
                                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {JSON.stringify(invalidError, null, 2)}
                                    </pre>
                                </Paper>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={() => setErrorMessage('')}
                message={errorMessage}
                ContentProps={{
                    style: { backgroundColor: '#d32f2f' }
                }}
            />
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                message={success}
                ContentProps={{
                    style: { backgroundColor: '#43a047' }
                }}
            />
        </Container>
    );
}
