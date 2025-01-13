// @flow
// libs
import * as React from 'react';
import { Helmet } from 'fusion-plugin-react-helmet-async';
import { Route, Switch, Redirect } from 'fusion-plugin-react-router';
import { split } from 'fusion-react';

// src
import { PageNotFound } from './containers/PageNotFound';
import { SnackbarProvider } from './components/Snackbar';
import { getAuthToken } from './utils';
import XssDemo from './components/XssDemo';

// Lazy load components
const Login = split({
  defer: true,
  load: () => import('./containers/Login/Login').then((module) => ({ default: module.Login })),
  LoadingComponent: () => <div>Loading...</div>,
  ErrorComponent: () => <div>Error loading login page!</div>,
});

const GraphQLExplorer = split({
  defer: true,
  load: () => import('./containers/GraphQLExplorer/GraphQLExplorer').then((module) => ({ default: module.GraphQLExplorer })),
  LoadingComponent: () => <div>Loading...</div>,
  ErrorComponent: () => <div>Error loading GraphQL explorer!</div>,
});

const CreateInvoice = split({
  defer: true,
  load: () => import('./containers/CreateInvoice').then((module) => ({ default: module.CreateInvoice })),
  LoadingComponent: () => <div>Loading...</div>,
  ErrorComponent: () => <div>Error loading create invoice page!</div>,
});

const ViewInvoice = split({
  defer: true,
  load: () => import('./containers/ViewInvoice').then((module) => ({ default: module.ViewInvoice })),
  LoadingComponent: () => <div>Loading...</div>,
  ErrorComponent: () => <div>Error loading view invoice page!</div>,
});

// Protected Route component
const ProtectedRoute = ({ component: Component, ...rest }) => {
  // For SSR, always render the component
  if (typeof window === 'undefined') {
    return <Route {...rest} render={(props) => <Component {...props} />} />;
  }

  // For client-side, check auth
  return (
    <Route
      {...rest}
      render={(props) =>
        getAuthToken() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
};

export const App = (
  <React.Fragment>
    <Helmet>
      <title>React Invoicer</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    </Helmet>
    <SnackbarProvider>
      <Switch>
        <Route exact path="/xss-demo" component={XssDemo} />
        <Route exact path="/login" component={Login} />
        <ProtectedRoute exact path="/" component={CreateInvoice} />
        <ProtectedRoute exact path="/graphql-explorer" component={GraphQLExplorer} />
        <ProtectedRoute exact path="/:id" component={ViewInvoice} />
        <Route component={PageNotFound} />
      </Switch>
    </SnackbarProvider>
  </React.Fragment>
);
