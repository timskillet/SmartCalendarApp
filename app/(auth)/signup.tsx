import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import "../../global.css";
import { supabase } from "../../lib/supabase";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.log(error);
      alert(error.message);
      setIsLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Error signing up");
      setIsLoading(false);
      return;
    }

    // User profile and default calendar created automatically via database trigger
    console.log("User created successfully:", user.id);

    setIsLoading(false);
  };

  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <View className="absolute top-12 left-4">
        <Pressable onPress={handleGoBack} testID="back-button">
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      </View>

      <Text className="w-80 text-center text-2xl font-bold mb-4">Sign Up</Text>
      <TextInput
        className="w-full p-3 mb-2 border border-gray-300 rounded-md"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="w-full p-3 mb-2 border border-gray-300 rounded-md"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable
        className="w-full p-3 mb-2 bg-blue-500 rounded-md text-center"
        onPress={handleSignup}
        disabled={isLoading}
      >
        <Text className="text-white text-center">
          {isLoading ? "Signing up..." : "Sign Up"}
        </Text>
      </Pressable>
    </View>
  );
}
