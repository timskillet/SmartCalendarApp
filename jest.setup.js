// Mock the Supabase client
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock any other dependencies that might cause issues
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
})); 