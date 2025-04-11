export {}

declare global {
  interface DiscordWebhookPayload {
    allowed_mentions?: any // allowed mention object (type needs to be defined)
    applied_tags?: string[] // array of tag ids to apply to the thread
    attachments?: DiscordWebhookAttachment[] // array of partial attachment objects
    avatar_url?: string // override the default avatar of the webhook
    components?: any[] // array of message component (type needs to be defined)
    content?: string // the message contents (up to 2000 characters)
    embeds?: DiscordWebhookEmbed[] // array of up to 10 embed objects
    files?: any[] // file contents (type needs to be defined)
    flags?: number // message flags combined as a bitfield
    payload_json?: string // JSON encoded body of non-file params
    poll?: any // poll request object (type needs to be defined)
    thread_name?: string // name of thread to create
    tts?: boolean // true if this is a TTS message
    username?: string // override the default username of the webhook
  }
}

interface DiscordWebhookAttachment {
  content_type?: string // the attachment's media type (optional)
  description?: string // description for the file (max 1024 characters, optional)
  duration_secs?: number // the duration of the audio file in seconds (optional, currently for voice messages)
  ephemeral?: boolean // whether this attachment is ephemeral (optional)
  filename: string // name of file attached
  flags?: number // attachment flags combined as a bitfield (optional)
  height?: number // height of file (if image, optional)
  id: number // attachment id (snowflake)
  proxy_url?: string // a proxied url of file
  size?: number // size of file in bytes
  title?: string // the title of the file (optional)
  url?: string // source url of file
  waveform?: string // base64 encoded bytearray representing a sampled waveform (optional, currently for voice messages)
  width?: number // width of file (if image, optional)
}

interface DiscordWebhookEmbed {
  author?: DiscordWebhookEmbedAuthor // embed author object
  color?: number // color code of the embed
  description?: string // description of embed
  fields?: DiscordWebhookEmbedField[] // array of embed field objects
  footer?: DiscordWebhookEmbedFooter // embed footer object
  image?: DiscordWebhookEmbedImage // embed image object
  provider?: DiscordWebhookEmbedProvider // embed provider object
  thumbnail?: DiscordWebhookEmbedThumbnail // embed thumbnail object
  timestamp?: string // ISO8601 timestamp
  title?: string // title of embed
  type?: string // type of embed (always "rich" for webhook embeds)
  url?: string // url of embed
  video?: DiscordWebhookEmbedVideo // embed video object
}

interface DiscordWebhookEmbedFooter {
  icon_url?: string // url of footer icon (optional)
  proxy_icon_url?: string // a proxied url of footer icon (optional)
  text: string // footer text
}

interface DiscordWebhookEmbedImage {
  height?: number // height of image (optional)
  proxy_url?: string // a proxied url of the image
  url?: string // source url of image
  width?: number // width of image (optional)
}

interface DiscordWebhookEmbedThumbnail {
  height?: number // height of thumbnail (optional)
  proxy_url?: string // a proxied url of the thumbnail
  url?: string // source url of thumbnail
  width?: number // width of thumbnail (optional)
}

interface DiscordWebhookEmbedVideo {
  height?: number // height of video (optional)
  url?: string // source url of video
  width?: number // width of video (optional)
}

interface DiscordWebhookEmbedProvider {
  name?: string // name of provider
  url?: string // url of provider
}

interface DiscordWebhookEmbedAuthor {
  icon_url?: string // url of author icon (optional)
  name: string // name of author
  proxy_icon_url?: string // a proxied url of author icon (optional)
  url?: string // url of author (optional)
}

interface DiscordWebhookEmbedField {
  inline?: boolean // whether or not this field should display inline (optional)
  name: string // name of the field
  value: string // value of the field
}
