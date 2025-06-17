import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ShareCalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  calendarId: string;
  calendarName: string;
}

type Permission = "view" | "edit" | "copy";

const permissionOptions: { value: Permission; label: string }[] = [
  { value: "view", label: "View Only" },
  { value: "edit", label: "Can Edit" },
  { value: "copy", label: "Can Copy" },
];

export const ShareCalendarModal: React.FC<ShareCalendarModalProps> = ({
  isVisible,
  onClose,
  calendarId,
  calendarName,
}) => {
  const [email, setEmail] = useState("");
  const [selectedPermission, setSelectedPermission] =
    useState<Permission>("view");
  const [isPermissionDropdownOpen, setIsPermissionDropdownOpen] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);

      if (!email.trim()) {
        setError("Please enter an email address");
        return;
      }

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        setError("You must be logged in to share calendars");
        return;
      }

      // Check if trying to share with self
      if (currentUser.email?.toLowerCase() === email.trim().toLowerCase()) {
        setError("You cannot share a calendar with yourself");
        return;
      }

      // First, find the user by email in auth.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email.trim())
        .single();

      console.log("User lookup result:", { userData, userError });

      if (userError) {
        console.error("User lookup error:", userError);
        if (userError.code === "PGRST116") {
          setError("User not found. Please check the email address.");
        } else {
          setError(`Error finding user: ${userError.message}`);
        }
        return;
      }

      if (!userData) {
        setError("User not found. Please check the email address.");
        return;
      }

      // Check if calendar is already shared with this user
      const { data: existingShare, error: checkError } = await supabase
        .from("calendar_shares")
        .select("id")
        .eq("calendar_id", calendarId)
        .eq("shared_with", userData.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Share check error:", checkError);
        setError("Error checking existing shares");
        return;
      }

      if (existingShare) {
        setError("Calendar is already shared with this user");
        return;
      }

      // Create the share
      const { error: shareError } = await supabase
        .from("calendar_shares")
        .insert([
          {
            calendar_id: calendarId,
            shared_with: userData.id,
            permission: selectedPermission,
          },
        ]);

      if (shareError) {
        console.error("Share creation error:", shareError);
        setError("Failed to share calendar. Please try again.");
        return;
      }

      setSuccess("Calendar shared successfully!");
      setEmail("");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-xl p-6 w-[90%] max-w-md">
              <Text className="text-2xl font-bold mb-4">Share Calendar</Text>
              <Text className="text-gray-600 mb-4">
                Share "{calendarName}" with others
              </Text>

              {/* Email Input */}
              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4"
                placeholder="Enter email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                  setSuccess(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              {/* Permission Dropdown */}
              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Permission Level</Text>
                <TouchableOpacity
                  onPress={() =>
                    !isLoading &&
                    setIsPermissionDropdownOpen(!isPermissionDropdownOpen)
                  }
                  className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
                  disabled={isLoading}
                >
                  <Text className="text-gray-700">
                    {permissionOptions.find(
                      (p) => p.value === selectedPermission
                    )?.label || "Select Permission"}
                  </Text>
                  <MaterialIcons
                    name={
                      isPermissionDropdownOpen
                        ? "arrow-drop-up"
                        : "arrow-drop-down"
                    }
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isPermissionDropdownOpen && (
                  <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                    {permissionOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => {
                          setSelectedPermission(option.value);
                          setIsPermissionDropdownOpen(false);
                        }}
                        className="p-3 border-b border-gray-100 last:border-b-0"
                      >
                        <Text className="text-gray-700">{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Error/Success Messages */}
              {error && (
                <Text className="text-red-500 mb-4 text-center">{error}</Text>
              )}
              {success && (
                <Text className="text-green-500 mb-4 text-center">
                  {success}
                </Text>
              )}

              {/* Action Buttons */}
              <View className="flex-row justify-end mt-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="px-4 py-2 mr-2"
                  disabled={isLoading}
                >
                  <Text className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  className={`px-4 py-2 rounded-lg ${
                    isLoading ? "bg-blue-300" : "bg-blue-500"
                  }`}
                  disabled={isLoading}
                >
                  <Text className="text-white">
                    {isLoading ? "Sharing..." : "Share"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
