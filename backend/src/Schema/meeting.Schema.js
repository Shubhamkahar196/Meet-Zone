import { z } from "zod";

export const meetingSchema = z.object({
    user_id: z.string(),
    meetingCode: z.string(),
    date: z.date().optional()

})

