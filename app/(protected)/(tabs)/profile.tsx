import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-6">
        <View className="items-center">
          <View className="relative">
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                <MaterialIcons name="person" size={48} color="#6B7280" />
              </View>
            )}
            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full">
              <MaterialIcons name="edit" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold mt-4">
            {profile?.full_name || "User"}
          </Text>
          <Text className="text-gray-500">{profile?.email}</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View className="px-4 py-6">
        {/* Account Settings */}
        <View className="bg-white rounded-xl shadow-sm mb-6">
          <Text className="text-lg font-semibold px-4 py-3 border-b border-gray-100">
            Account Settings
          </Text>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="person" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="notifications" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3">
            <MaterialIcons name="security" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Privacy & Security</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-xl shadow-sm mb-6">
          <Text className="text-lg font-semibold px-4 py-3 border-b border-gray-100">
            Preferences
          </Text>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="language" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Language</Text>
            <Text className="text-gray-500 mr-2">English</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="access-time" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Time Zone</Text>
            <Text className="text-gray-500 mr-2">UTC+0</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3">
            <MaterialIcons name="palette" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Appearance</Text>
            <Text className="text-gray-500 mr-2">Light</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Support & About */}
        <View className="bg-white rounded-xl shadow-sm mb-6">
          <Text className="text-lg font-semibold px-4 py-3 border-b border-gray-100">
            Support & About
          </Text>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="help" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <MaterialIcons name="info" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">About</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-3">
            <MaterialIcons name="feedback" size={24} color="#6B7280" />
            <Text className="ml-3 flex-1">Send Feedback</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 rounded-xl py-3 mb-6"
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text className="text-center text-gray-400 mb-6">Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default Profile;
