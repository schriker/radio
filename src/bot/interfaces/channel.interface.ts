export interface Channel {
  id: string;
  service: string;
  channel: {
    display_name: string;
    game: string;
    title: string;
    viewers: 0;
    thumbnail: string;
    url: string;
    player: string;
    chat: string;
    status: boolean;
  };
  watch: {
    viewers: number;
    active_viewers: number;
    community_stream: boolean;
    featured: boolean;
    hidden: boolean;
    restricted_modes: string;
    created_at: number;
  };
}
