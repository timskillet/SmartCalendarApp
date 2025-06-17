import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CalendarInvite {
  id: string;
  calendar_id: string;
  calendar_name: string;
  shared_by: {
    email: string;
  };
  permission: "view" | "edit" | "copy";
  created_at: string;
  status: "pending" | "accepted" | "declined";
}

interface TaskInvite {
  id: string;
  task_id: string;
  task_title: string;
  shared_by: {
    email: string;
  };
  created_at: string;
  status: "pending" | "accepted" | "declined";
}

interface CalendarShareResponse {
  id: string;
  calendar_id: string;
  permission: "view" | "edit" | "copy";
  created_at: string;
  status: "pending" | "accepted" | "declined";
  calendars: {
    name: string;
  };
  shared_by: {
    user_id: string;
    users: {
      email: string;
    };
  };
}

interface TaskShareResponse {
  id: string;
  task_id: string;
  created_at: string;
  status: "pending" | "accepted" | "declined";
  tasks: {
    title: string;
  };
  shared_by: {
    user_id: string;
    users: {
      email: string;
    };
  };
}

const Inbox = () => {
  const [calendarInvites, setCalendarInvites] = useState<CalendarInvite[]>([]);
  const [taskInvites, setTaskInvites] = useState<TaskInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch calendar invites
      const { data: calendarInvitesData, error: calendarError } = await supabase
        .from("calendar_shares")
        .select(
          `
          id,
          calendar_id,
          permission,
          created_at,
          status,
          calendars (
            name
          ),
          shared_by:calendars!inner (
            user_id,
            users (
              email
            )
          )
        `
        )
        .eq("shared_with", user.id)
        .eq("status", "pending");

      if (calendarError) throw calendarError;

      // Transform calendar invites data
      const transformedCalendarInvites = (
        calendarInvitesData as unknown as CalendarShareResponse[]
      ).map((invite) => ({
        id: invite.id,
        calendar_id: invite.calendar_id,
        calendar_name: invite.calendars.name,
        shared_by: {
          email: invite.shared_by.users.email,
        },
        permission: invite.permission,
        created_at: invite.created_at,
        status: invite.status,
      }));

      setCalendarInvites(transformedCalendarInvites);

      // Fetch task invites
      const { data: taskInvitesData, error: taskError } = await supabase
        .from("task_shares")
        .select(
          `
          id,
          task_id,
          created_at,
          status,
          tasks (
            title
          ),
          shared_by:tasks!inner (
            user_id,
            users (
              email
            )
          )
        `
        )
        .eq("shared_with", user.id)
        .eq("status", "pending");

      if (taskError) throw taskError;

      // Transform task invites data
      const transformedTaskInvites = (
        taskInvitesData as unknown as TaskShareResponse[]
      ).map((invite) => ({
        id: invite.id,
        task_id: invite.task_id,
        task_title: invite.tasks.title,
        shared_by: {
          email: invite.shared_by.users.email,
        },
        created_at: invite.created_at,
        status: invite.status,
      }));

      setTaskInvites(transformedTaskInvites);
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCalendarInviteResponse = async (
    inviteId: string,
    response: "accepted" | "declined"
  ) => {
    try {
      const { error } = await supabase
        .from("calendar_shares")
        .update({ status: response })
        .eq("id", inviteId);

      if (error) throw error;

      // Refresh invites
      fetchInvites();
    } catch (error) {
      console.error("Error responding to calendar invite:", error);
    }
  };

  const handleTaskInviteResponse = async (
    inviteId: string,
    response: "accepted" | "declined"
  ) => {
    try {
      const { error } = await supabase
        .from("task_shares")
        .update({ status: response })
        .eq("id", inviteId);

      if (error) throw error;

      // Refresh invites
      fetchInvites();
    } catch (error) {
      console.error("Error responding to task invite:", error);
    }
  };

  const renderCalendarInvite = (invite: CalendarInvite) => (
    <Pressable
      key={invite.id}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="event-available" size={24} color="#4CAF50" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          {invite.calendar_name}
        </Text>
      </View>
      <Text className="text-sm text-gray-600 mb-1">
        From: {invite.shared_by.email}
      </Text>
      <Text className="text-sm text-gray-600 mb-3">
        Permission: {invite.permission}
      </Text>
      <View className="flex-row justify-end gap-2">
        <Pressable
          className="bg-green-500 px-4 py-2 rounded-lg min-w-[100px] items-center"
          onPress={() => handleCalendarInviteResponse(invite.id, "accepted")}
        >
          <Text className="text-white font-semibold">Accept</Text>
        </Pressable>
        <Pressable
          className="bg-red-500 px-4 py-2 rounded-lg min-w-[100px] items-center"
          onPress={() => handleCalendarInviteResponse(invite.id, "declined")}
        >
          <Text className="text-white font-semibold">Decline</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderTaskInvite = (invite: TaskInvite) => (
    <Pressable
      key={invite.id}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="assignment" size={24} color="#2196F3" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          {invite.task_title}
        </Text>
      </View>
      <Text className="text-sm text-gray-600 mb-1">
        From: {invite.shared_by.email}
      </Text>
      <View className="flex-row justify-end gap-2">
        <Pressable
          className="bg-green-500 px-4 py-2 rounded-lg min-w-[100px] items-center"
          onPress={() => handleTaskInviteResponse(invite.id, "accepted")}
        >
          <Text className="text-white font-semibold">Accept</Text>
        </Pressable>
        <Pressable
          className="bg-red-500 px-4 py-2 rounded-lg min-w-[100px] items-center"
          onPress={() => handleTaskInviteResponse(invite.id, "declined")}
        >
          <Text className="text-white font-semibold">Decline</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center px-4 py-2">
        <View className="flex-1 flex-row justify-between items-center">
          <Text className="text-3xl font-bold text-gray-800">Inbox</Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-blue-500/80 items-center justify-center"
            onPress={() => {
              router.push("/scheduler_form");
            }}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-green-500/80 items-center justify-center"
            onPress={() => {
              router.push("/inbox");
            }}
          >
            <MaterialIcons name="email" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-purple-500/80 items-center justify-center"
            onPress={() => {
              /* Handle notification button press */
            }}
          >
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {calendarInvites.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold mb-4 text-gray-800">
                Calendar Invites
              </Text>
              {calendarInvites.map(renderCalendarInvite)}
            </View>
          )}

          {taskInvites.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold mb-4 text-gray-800">
                Task Invites
              </Text>
              {taskInvites.map(renderTaskInvite)}
            </View>
          )}

          {calendarInvites.length === 0 && taskInvites.length === 0 && (
            <View className="flex-1 justify-center items-center py-8">
              <Text className="text-gray-500 text-lg">No pending invites</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Inbox;
