import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import "../global.css";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold mb-4">Login</Text>
      <TextInput
        className="w-80 p-3 border border-gray-300 rounded-md mb-2"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="w-80 p-3 border border-gray-300 rounded-md mb-2"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable
        className="bg-blue-500 p-3 rounded-md w-80 text-center"
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text className="text-white font-bold text-center">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>
    </View>
  );
}
