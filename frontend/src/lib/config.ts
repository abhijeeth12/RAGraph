/**
 * Application feature flags and centralized runtime configuration.
 */

// Centralized master feature flag controlling image-related functionality.
// When false (default), the application operates in text-only mode:
// - Image grids and lightbox viewers are disabled
// - Chatbot and search streams exclude image results and previews
// - 'Visual' focus mode is filtered out from notebook creation
// - MindMap/KnowledgeMap omits image elements
export const ENABLE_IMAGES = false
