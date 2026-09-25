// Every conversation — space or direct message — lives in one list,
// tagged with `type`, so both sidebar sections and the Home list read
// from the same source of truth.
export const conversations = [
  { id: 1, type: "space", name: "Moderation team", initials: "MT", color: "#7C5CFC", preview: "New report needs a review.", time: "10:32 AM", unread: 2 },
  { id: 2, type: "space", name: "Support leads", initials: "SL", color: "#168A72", preview: "The response template is ready.", time: "9:48 AM" },
  { id: 3, type: "space", name: "Product admins", initials: "PA", color: "#D86A33", preview: "Let’s review the release notes.", time: "Yesterday" },
  { id: 4, type: "dm", name: "Priya Shah", initials: "PS", color: "#D86A33", preview: "I’ll review the reports and update the case status.", time: "10:28 AM" },
];

// Each conversation keeps its own thread. Priya Shah's DM includes an
// already-sent file card (image message with a caption).
export const initialMessagesByConversation = {
  1: [
    { id: 1, sender: "Priya Shah", initials: "PS", color: "#7C5CFC", text: "Two reports were received for the same account. Could someone take a look?", time: "10:24 AM" },
    { id: 2, sender: "You", text: "I’ll review the reports and update the case status.", time: "10:28 AM", mine: true },
    { id: 3, sender: "Arjun Mehta", initials: "AM", color: "#168A72", text: "I have checked the account history. There is enough context to proceed with a warning.", time: "10:31 AM" },
  ],
  2: [
    { id: 1, sender: "Rohan Kulkarni", initials: "RK", color: "#168A72", text: "The response template is ready for review.", time: "9:40 AM" },
    { id: 2, sender: "You", text: "Looks good — let’s roll it out to the support team.", time: "9:48 AM", mine: true },
  ],
  3: [
    { id: 1, sender: "Neha Verma", initials: "NV", color: "#D86A33", text: "Let’s review the release notes before Friday.", time: "Yesterday" },
  ],
  4: [
    { id: 1, sender: "Priya Shah", initials: "PS", color: "#7C5CFC", text: "Sharing the screenshot of the flagged upload.", time: "10:20 AM" },
    { id: 2, sender: "Priya Shah", initials: "PS", color: "#7C5CFC", type: "file", caption: "Policy violation - file removed", time: "10:21 AM" },
    { id: 3, sender: "You", text: "I’ll review the reports and update the case status.", time: "10:28 AM", mine: true },
  ],
};

// The signed-in admin. Always the first member of any space.
export const youMember = { id: "you", name: "You", email: "You are an admin", initials: "YO", color: "#fd7e13" };

// The people an admin can add to a space. Kept separate from `youMember`
// so a space's member list is always `[youMember, ...someOfThese]`.
export const frequentContacts = [
  { id: "saket", name: "Saket Babar", email: "saketbabar1997@gmail.com", initials: "SB", color: "#D86A33" },
  { id: "sopan", name: "Sopan Dugane", email: "sopan07.embel@gmail.com", initials: "SD", color: "#168A72" },
  { id: "aditya", name: "Aditya Salkar", email: "adityasalkar1806@gmail.com", initials: "AS", color: "#5C6570" },
  { id: "nisha", name: "Nisha Patil", email: "nisha.patil@embel.com", initials: "NP", color: "#B05C9E" },
  { id: "rahul", name: "Rahul Deshmukh", email: "rahul.deshmukh@embel.com", initials: "RD", color: "#3E78A8" },
];

// IMPORTANT: each existing space starts with its OWN member list, keyed
// by conversation id. This is what the old version got wrong — every
// space reused the exact same hard-coded four people, so switching
// between "Moderation team", "Support leads", etc. never changed who
// showed up in "Add members". Newly created groups get their own entry
// too (seeded with just `youMember`) the moment they're created.
export const initialSpaceMembers = {
  1: [youMember, frequentContacts[0], frequentContacts[1], frequentContacts[2]], // Moderation team
  2: [youMember, frequentContacts[1], frequentContacts[3]], // Support leads
  3: [youMember, frequentContacts[2], frequentContacts[4]], // Product admins
};

export const statusOptions = [
  { label: "Active", color: "#3E8E5A" },
  { label: "Away", color: "#B8862E" },
  { label: "Do not disturb", color: "#C1443A" },
];
