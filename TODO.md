# TODO: Improve Chatbot Response Quality

## 1. Enhance Image Fetching
- [x] Add retry logic for Pexels API calls in ChatBot.jsx
- [x] Improve error handling for image loading failures
- [x] Ensure images are displayed properly in response text (fix markdown rendering)
- [x] Add fallback images for failed fetches

## 2. Improve Location Fetching
- [x] Validate coordinates in getPlaceDetails (GlobalApi.jsx)
- [x] Add fallbacks for location API failures
- [x] Ensure accurate geo data parsing and error messages

## 3. Upgrade Map Button Functionality
- [x] Fix map center updates in ChatBot.jsx
- [x] Add external map links (Google Maps) for better accuracy
- [x] Improve UI feedback for map interactions
- [x] Ensure buttons are responsive and update iframe correctly

## 4. Add Iterative Response Features
- [x] Add buttons/options for users to refine responses (e.g., "Change duration", "Regenerate hotels")
- [x] Implement conversation history to allow modifications
- [x] Update AIModel.jsx prompts if needed for better iterations

## Followup Steps
- [ ] Test image loading and display
- [ ] Verify map updates and button functionality
- [ ] Check location accuracy with various queries
- [ ] Add user feedback mechanisms for iterations
