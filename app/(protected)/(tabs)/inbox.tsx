import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data - replace with actual data from your backend
const mockInvites = [
  {
    id: 1,
    from: "John Doe",
    eventName: "Team Meeting",
    date: "2024-03-20",
    status: "pending",
  },
  {
    id: 2,
    from: "Jane Smith",
    eventName: "Family Reunion",
    date: "2024-04-15",
    status: "accepted",
  },
  // ... more invites
];

const mockProposals = [
  {
    id: 1,
    title: "Project Review",
    participants: ["Alice", "Bob", "Charlie"],
    suggestedDates: 3,
    status: "awaiting_responses",
  },
  // ... more proposals
];

const Inbox = () => {
  const renderInviteItem = (invite: any) => (
    <Pressable
      key={invite.id}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={() => {
        /* Handle invite press */
      }}
    >
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="event-available" size={24} color="#4CAF50" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          {invite.eventName}
        </Text>
      </View>
      <Text className="text-sm text-gray-600 mb-1">From: {invite.from}</Text>
      <Text className="text-sm text-gray-600 mb-3">Date: {invite.date}</Text>
      <View className="flex-row justify-end gap-2">
        <Pressable className="bg-green-500 px-4 py-2 rounded-lg min-w-[100px] items-center">
          <Text className="text-white font-semibold">Accept</Text>
        </Pressable>
        <Pressable className="bg-red-500 px-4 py-2 rounded-lg min-w-[100px] items-center">
          <Text className="text-white font-semibold">Decline</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderProposalItem = (proposal: any) => (
    <Pressable
      key={proposal.id}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={() => {
        /* Handle proposal press */
      }}
    >
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="schedule" size={24} color="#2196F3" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          {proposal.title}
        </Text>
      </View>
      <Text className="text-sm text-gray-600 mb-1">
        {proposal.participants.length} participants
      </Text>
      <Text className="text-sm text-gray-600 mb-3">
        {proposal.suggestedDates} suggested dates
      </Text>
      <View className="flex-row justify-end">
        <Pressable className="bg-blue-500 px-4 py-2 rounded-lg min-w-[100px] items-center">
          <Text className="text-white font-semibold">Review Dates</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-xl font-bold mb-4 text-gray-800">Invites</Text>
          <ScrollView horizontal>
            {mockInvites.map(renderInviteItem)}
          </ScrollView>
        </View>

        <View className="mb-6">
          <Text className="text-xl font-bold mb-4 text-gray-800">
            Event Proposals
          </Text>
          {mockProposals.map(renderProposalItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Inbox;
