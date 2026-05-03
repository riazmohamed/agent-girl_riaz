/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Model Configuration
 *
 * Centralized definitions for all available AI models.
 * Add new models here to make them available in the UI.
 */

export type ProviderType = 'anthropic' | 'z-ai' | 'moonshot' | 'xiaomi';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  apiModelId: string;
  provider: ProviderType;
}

/**
 * Available Models
 *
 * Add new models to this array to make them available in the model selector.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'glm-5.1',
    name: 'GLM 5.1',
    description: 'Z.AI\'s flagship agentic engineering model for long-horizon coding and autonomous execution',
    apiModelId: 'glm-5.1',
    provider: 'z-ai',
  },
  {
    id: 'kimi-k2.6',
    name: 'Kimi K2.6',
    description: 'Moonshot\'s next-generation multimodal model for long-horizon coding and multi-agent orchestration',
    apiModelId: 'kimi-k2.6',
    provider: 'moonshot',
  },
  {
    id: 'mimo-v2.5-pro',
    name: 'MiMo V2.5 Pro',
    description: 'Xiaomi\'s flagship MoE model with 1M-token context for complex software engineering and long-horizon agentic tasks',
    apiModelId: 'mimo-v2.5-pro',
    provider: 'xiaomi',
  },
];

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Get the default model
 */
export function getDefaultModel(): ModelConfig {
  return AVAILABLE_MODELS[0];
}
