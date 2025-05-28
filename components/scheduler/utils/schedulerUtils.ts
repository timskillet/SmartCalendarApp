import { supabase } from "@/lib/supabase";
import { addMinutes, format, parse } from "date-fns";

// Cache for storing submissions and suggestions
let submissionsCache: { [proposalId: string]: AvailabilitySubmission[] } = {};
let suggestionsCache: { [proposalId: string]: Suggestion[] } = {};

export async function computeAvailability(proposalId: string) {
    console.log("Computing availability for proposal:", proposalId);
    
    // Check cache first
    if (suggestionsCache[proposalId]) {
        return suggestionsCache[proposalId];
    }

    // Fetch proposal and submissions in parallel
    const [proposalResult, submissionsResult] = await Promise.all([
        supabase
            .from('event_proposals')
            .select('*')
            .eq('id', proposalId)
            .single(),
        supabase
            .from('availability_submissions')
            .select('*')
            .eq('proposal_id', proposalId)
    ]);

    if (proposalResult.error) {
        console.error("Error fetching proposal:", proposalResult.error);
        return [];
    }

    if (submissionsResult.error) {
        console.error("Error fetching submissions:", submissionsResult.error);
        return [];
    }

    // Update submissions cache
    submissionsCache[proposalId] = submissionsResult.data;

    // Calculate available slots
    const availableSlots = calculateAvailableSlots(proposalResult.data, submissionsResult.data);
    const scoredSlots = scoreTimeSlots(availableSlots, proposalResult.data);

    const suggestions = scoredSlots.map(slot => ({
        proposal_id: proposalId,
        suggested_date: format(slot.start, 'yyyy-MM-dd'),
        suggested_start_time: format(slot.start, 'HH:mm:ss'),
        suggested_end_time: format(slot.end, 'HH:mm:ss'),
        participant_count: slot.participants.length,
        score: slot.score,
        metadata: { participants: slot.participants }
    }));

    // Update suggestions cache
    suggestionsCache[proposalId] = suggestions;

    // Insert suggestions in the background
    supabase
        .from('event_suggestions')
        .insert(suggestions)
        .then(({ error }) => {
            if (error) {
                console.error("Error inserting suggestions:", error);
            }
        });

    return suggestions;
}

// Function to subscribe to real-time updates
export function subscribeToAvailabilityUpdates(proposalId: string, onUpdate: (suggestions: Suggestion[]) => void) {
    // Subscribe to new submissions
    const submissionsSubscription = supabase
        .channel(`availability_submissions:${proposalId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'availability_submissions',
                filter: `proposal_id=eq.${proposalId}`
            }, 
            async () => {
                // Recompute suggestions when new submission arrives
                const suggestions = await computeAvailability(proposalId);
                onUpdate(suggestions);
            }
        )
        .subscribe();

    return () => {
        submissionsSubscription.unsubscribe();
    };
}

// Function to clear cache for a proposal
export function clearProposalCache(proposalId: string) {
    delete submissionsCache[proposalId];
    delete suggestionsCache[proposalId];
}

export interface AvailabilitySubmission {
  user_id: string
  proposal_id: string
  availability: {
    [date: string]: string[] // array of time slots in HH:mm format
  }
  submitted_at: string
}

export interface EventProposal {
  id: string
  creator_id: string
  title: string
  description: string
  proposed_dates: string[]
  time_range_start: string
  time_range_end: string
  duration_minutes: number
  timezone: string
  invitee_ids: string[]
}

export interface TimeSlot {
  start: Date
  end: Date
  participants: string[]
}

export interface Suggestion {
  proposal_id: string;
  suggested_date: string;
  suggested_start_time: string;
  suggested_end_time: string;
  participant_count: number;
  score: number;
  metadata: {
    participants: string[];
  };
}

function calculateAvailableSlots(
  proposal: EventProposal,
  submissions: AvailabilitySubmission[]
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const duration = proposal.duration_minutes

  // For each proposed date
  for (const date of proposal.proposed_dates) {
    const startTime = parse(proposal.time_range_start, 'HH:mm:ss', new Date())
    const endTime = parse(proposal.time_range_end, 'HH:mm:ss', new Date())

    // Generate all possible time slots
    let currentTime = new Date(date)
    currentTime.setHours(startTime.getHours(), startTime.getMinutes(), 0)

    const endDateTime = new Date(date)
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0)

    while (currentTime < endDateTime) {
      const slotEnd = addMinutes(currentTime, duration)
      
      // Check if this slot works for all participants
      const availableParticipants = submissions.filter(submission => {
        const dayAvailability = submission.availability[date] || []
        return dayAvailability.some(time => {
          // Parse the availability time into a Date object for the current date
          const [hours, minutes] = time.split(':').map(Number)
          const availabilityStart = new Date(date)
          availabilityStart.setHours(hours, minutes, 0)
          const availabilityEnd = addMinutes(availabilityStart, duration)
          
          // Check if the current slot overlaps with the availability
          return (
            (currentTime >= availabilityStart && currentTime < availabilityEnd) ||
            (slotEnd > availabilityStart && slotEnd <= availabilityEnd) ||
            (currentTime <= availabilityStart && slotEnd >= availabilityEnd)
          )
        })
      }).map(s => s.user_id)

      if (availableParticipants.length > 0) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          participants: availableParticipants
        })
      }

      currentTime = addMinutes(currentTime, 30) // Move to next 30-minute slot
    }
  }

  return slots
}

function scoreTimeSlots(slots: TimeSlot[], proposal: EventProposal): (TimeSlot & { score: number })[] {
  return slots.map(slot => {
    let score = 0

    // Base score on number of participants
    score += slot.participants.length * 10

    // Bonus for slots that include all invitees
    if (slot.participants.length === proposal.invitee_ids.length) {
      score += 50
    }

    // Penalty for slots too early or too late
    const hour = slot.start.getHours()
    if (hour < 9 || hour > 17) {
      score -= 20
    }

    // Bonus for slots during typical working hours
    if (hour >= 10 && hour <= 15) {
      score += 15
    }

    return {
      ...slot,
      score
    }
  }).sort((a, b) => b.score - a.score) // Sort by score descending
}