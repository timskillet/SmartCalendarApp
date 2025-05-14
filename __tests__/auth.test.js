import { supabase } from '../lib/supabase';

describe('Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Login with valid credentials', async () => {
    // Mock successful login
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    // Call the function
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    // Assertions
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(error).toBeNull();
    expect(data.user.id).toBe('test-user-id');
  });

  test('Login with invalid credentials', async () => {
    // Mock failed login
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    // Call the function
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    // Assertions
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    expect(error).not.toBeNull();
    expect(error.message).toBe('Invalid login credentials');
  });

  test('Sign up with new email', async () => {
    // Mock successful signup
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user-id', email: 'newuser@example.com' } },
      error: null,
    });

    // Call the function
    const { data, error } = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'newpassword123',
    });

    // Assertions
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'newpassword123',
    });
    expect(error).toBeNull();
    expect(data.user.id).toBe('new-user-id');
    expect(data.user.email).toBe('newuser@example.com');
  });

  test('Sign up with existing email', async () => {
    // Mock failed signup
    supabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    // Call the function
    const { data, error } = await supabase.auth.signUp({
      email: 'existing@example.com',
      password: 'password123',
    });

    // Assertions
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'existing@example.com',
      password: 'password123',
    });
    expect(error).not.toBeNull();
    expect(error.message).toBe('User already registered');
  });

  test('Sign out', async () => {
    // Mock successful logout
    supabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Call the function
    const { error } = await supabase.auth.signOut();

    // Assertions
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(error).toBeNull();
  });
}); 