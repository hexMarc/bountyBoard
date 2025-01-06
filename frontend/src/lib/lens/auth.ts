import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const API_URL = 'https://api.testnet.lens.dev/';

export const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

export const CHALLENGE_QUERY = gql`
  query Challenge($request: ChallengeRequest!) {
    challenge(request: $request) {
      text
    }
  }
`;

export const AUTHENTICATE_MUTATION = gql`
  mutation Authenticate($request: SignedAuthChallenge!) {
    authenticate(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

export const GET_PROFILE_QUERY = gql`
  query Profile($request: ProfileRequest!) {
    profile(request: $request) {
      id
      handle
      ownedBy
    }
  }
`;

export const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
    }
  }
`;

export async function generateChallenge(address: string) {
  const { data } = await client.query({
    query: CHALLENGE_QUERY,
    variables: {
      request: {
        address,
      },
    },
  });
  return data.challenge.text;
}

export async function authenticate(address: string, signature: string) {
  const { data } = await client.mutate({
    mutation: AUTHENTICATE_MUTATION,
    variables: {
      request: {
        address,
        signature,
      },
    },
  });
  return data.authenticate;
}

export async function getProfile(address: string) {
  try {
    const { data } = await client.query({
      query: GET_PROFILE_QUERY,
      variables: {
        request: {
          ownedBy: [address],
        },
      },
    });
    return data.profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function createProfile(handle: string, address: string) {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_PROFILE_MUTATION,
      variables: {
        request: {
          handle,
          to: address,
        },
      },
    });
    return data.createProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}
