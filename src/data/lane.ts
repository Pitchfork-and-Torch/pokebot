import type { Verdict } from "./types";

export const LANE_COUNT = 8;
export const LANE_MATCH_INDEX = 7;
export const LANE_DONE = 8;
export const LANE_MATCH_BRIEF = "Write a weekly account-health file. Never contact a customer.";

export type LaneStation = {
  id: string;
  paste: string | null;
  expected: Verdict;
  teach: string;
  miss: string;
};

export const LANE: LaneStation[] = [
  {
    id: "spam",
    paste: "I need a bot that DMs inbound leads every morning.",
    expected: "SKIP",
    teach: "Spam job. It DMs strangers. Stamp Skip.",
    miss: "That job DMs strangers every morning.",
  },
  {
    id: "sense",
    paste: "Own weekly account health. Never contact a customer.",
    expected: "CATCH",
    teach: "One job and a never-list. Stamp Catch, then it pins to the first hole.",
    miss: "This is a Sense job with a fence. Catch it.",
  },
  {
    id: "costume",
    paste: "Basedpepe. Be a meme. No owner. No job.",
    expected: "SKIP",
    teach: "Share-page costume. No job. Stamp Skip.",
    miss: "Avatar, no owner, no job. Skip it.",
  },
  {
    id: "scout",
    paste: "Flick. Research people, news, and competitive intel. Return sources, not vibes. Never contact a subject. Never present rumor as fact. Never publish.",
    expected: "CATCH",
    teach: "Scout with sources and a fence. Stamp Catch.",
    miss: "This Scout has a job and a never-list. Catch it.",
  },
  {
    id: "dup",
    paste: "Glimmer: research people, news, and competitive intel. Return sources, not vibes.",
    expected: "WATCH",
    teach: "Same job as Flick. Stamp Watch.",
    miss: "Flick already owns this job. Watch it.",
  },
  {
    id: "forge",
    paste: "Write code and merge it to main. Auto-merge. Keep main green by force.",
    expected: "WATCH",
    teach: "Forge that merges with no approval. Stamp Watch.",
    miss: "It wants to merge without a gate. Watch it.",
  },
  {
    id: "stub",
    paste: "Nameless. I want a general helper that does everything.",
    expected: "SKIP",
    teach: "A name with no real job. Stamp Skip.",
    miss: "General helper. Skip it.",
  },
  {
    id: "match",
    paste: null,
    expected: "CATCH",
    teach: "Docket empty. Open Gym. A runs the Monday brief against your six.",
    miss: "Open Gym and run the match.",
  },
];
