import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z
    .object({
      // Required
      title: z.string(),
      date: z.coerce.date(),

      // Optional metadata
      description: z.string().optional(),
      excerpt: z.string().optional(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      author: z.string().optional(),

      // Images and social
      coverImage: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .transform((data) => {
      // Prefer `description` but fall back to `excerpt` if present
      if (!data.description && data.excerpt) {
        return { ...data, description: data.excerpt };
      }
      return data;
    }),
});

export const collections = { posts };
