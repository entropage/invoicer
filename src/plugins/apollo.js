// @flow
import { createPlugin, createToken } from 'fusion-core';
import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { from } from '@apollo/client';

export const ApolloClientToken = createToken('ApolloClientToken');
export const ApolloContextToken = createToken('ApolloContextToken');

const ApolloClientPlugin = createPlugin({
    deps: {
        context: ApolloContextToken.optional,
    },
    provides({ context } = {}) {
        if (__NODE__) return null;

        const httpLink = createHttpLink({
            uri: '/graphql',
            credentials: 'same-origin',
        });

        const authLink = setContext((_, { headers }) => {
            const token = localStorage.getItem('token');
            return {
                headers: {
                    ...headers,
                    authorization: token ? `Bearer ${token}` : '',
                }
            };
        });

        // Error handling link
        const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
            if (graphQLErrors) {
                graphQLErrors.forEach(({ message, locations, path }) => {
                    console.error(
                        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                    );
                });
            }
            if (networkError) {
                console.error(`[Network error]: ${networkError}`);
            }
        });

        const requestLink = from([
            (operation, forward) => {
                console.log('[Apollo Request]', {
                    operationName: operation.operationName,
                    variables: operation.variables,
                });
                return forward(operation).map((response) => {
                    console.log('[Apollo Response]', {
                        operationName: operation.operationName,
                        data: response.data,
                        errors: response.errors,
                    });
                    return response;
                });
            }
        ]);

        return new ApolloClient({
            link: from([errorLink, requestLink, authLink, httpLink]),
            cache: new InMemoryCache({
                typePolicies: {
                    Query: {
                        fields: {
                            user: {
                                merge: true,
                            },
                            searchInvoices: {
                                merge: false,
                            },
                        },
                    },
                },
            }),
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: 'network-only',
                    errorPolicy: 'all',
                },
                query: {
                    fetchPolicy: 'network-only',
                    errorPolicy: 'all',
                },
                mutate: {
                    errorPolicy: 'all',
                },
            },
            ...(context || {}),
        });
    },
});

const ApolloRootProviderPlugin = createPlugin({
    deps: {
        client: ApolloClientToken,
    },
    provides() {
        return null;
    },
    middleware({ client }) {
        return (ctx, next) => {
            if (__NODE__) {
                return next();
            }
            ctx.element = (
                <ApolloProvider client={client}>
                    {ctx.element}
                </ApolloProvider>
            );
            return next();
        };
    },
});

export { ApolloClientPlugin, ApolloRootProviderPlugin };
