import { Leaderboard, LeaderboardEntry } from '../../../common/src/Types'
import Db from '../Db'

interface LeaderboardRow {
  id: number
  name: string
}

export class LeaderboardRepo {
  private readonly LEADERBOARDS = [
    { name: 'alltime' },
    { name: 'week' },
    { name: 'month' },
  ]

  constructor(
    private readonly db: Db,
  ) {
    // pass
  }

  public async updateLeaderboards(): Promise<void> {
    await this.db.txn(async () => {
      await this.db.run('truncate leaderboard_entries')

      for (const lb of this.LEADERBOARDS) {
        const leaderboardId = await this.db.upsert('leaderboard', { name: lb.name }, { name: lb.name }, 'id')
        const rows = await this.db._getMany(`
          with relevant_users as (
            select u.id from users u
              inner join user_identity ui on ui.user_id = u.id and ui.provider_name = 'local'
              inner join accounts a on a.id::text = ui.provider_id and a.status = 'verified'
            union
            select u.id from users u
              inner join user_identity ui on ui.user_id = u.id and ui.provider_name = 'twitch'
          ),
          tmp as (
            select
              uxg.user_id,
              count(uxg.game_id)::int as games_count,
              sum(uxg.pieces_count)::int as pieces_count
            from user_x_game uxg
            inner join games g on g.id = uxg.game_id and g.finished is not null and g.private = 0
            where
              uxg.pieces_count > 0
              ${
                lb.name === 'week' ? `and g.finished > (current_timestamp - interval '1 week')` :
                lb.name === 'month' ? `and g.finished > (current_timestamp - interval '1 month')` :
                ''
              }
            group by uxg.user_id
          )
          select
            u.id as user_id,
            coalesce(tmp.games_count, 0) as games_count,
            coalesce(tmp.pieces_count, 0) as pieces_count
          from relevant_users u
          left join tmp on tmp.user_id = u.id
          order by pieces_count desc, games_count desc
        `)
        let i = 1
        for (const row of rows) {
          row.leaderboard_id = leaderboardId
          row.rank = row.pieces_count ? i : 0
          this.db.insert('leaderboard_entries', row)
          i++
        }
      }
    })
  }

  public async getTop10(userId: number): Promise<Leaderboard[]> {
    const leaderboards: Leaderboard[] = []
    for (const lb of this.LEADERBOARDS) {
      const leaderboard: LeaderboardRow | null = await this.db.get('leaderboard', { name: lb.name })
      if (!leaderboard) {
        continue
      }
      const leaderboardUserEntry: LeaderboardEntry | null = userId ? await this.db._get(`
        with players AS (
          select distinct on (client_id)
          jsonb_array_elements(g.data::jsonb->'players')->>0 as client_id,
          jsonb_array_elements(g.data::jsonb->'players')->>4 as user_name,
          jsonb_array_elements(g.data::jsonb->'players')->>5 as color,
          jsonb_array_elements(g.data::jsonb->'players')->>8 as ts
          from games g
          order by client_id, ts desc
          )
        select
          lbe.*, 
          u.name as user_name,
          p.user_name,
          p.color,
          p.ts
        from leaderboard_entries lbe
          inner join users u on u.id = lbe.user_id
          inner join players p on p.client_id = u.client_id
        where lbe.user_id = $1 and lbe.leaderboard_id = $2
      `, [userId, leaderboard.id]) : null
      const leaderboardEntries: LeaderboardEntry[] = await this.db._getMany(`
        with players AS (
          select distinct on (client_id)
          jsonb_array_elements(g.data::jsonb->'players')->>0 as client_id,
          jsonb_array_elements(g.data::jsonb->'players')->>4 as user_name,
          jsonb_array_elements(g.data::jsonb->'players')->>5 as color,
          jsonb_array_elements(g.data::jsonb->'players')->>8 as ts
          from games g
          order by client_id, ts desc
          )
        select
          lbe.*, 
          u.name as registered_name,
          p.user_name,
          p.color,
          p.ts
        from leaderboard_entries lbe
          inner join users u on u.id = lbe.user_id
          inner join players p on p.client_id = u.client_id
        where
          lbe.leaderboard_id = $1
          and lbe.pieces_count > 0
        order by
          lbe.pieces_count desc,
          lbe.games_count desc
        limit 10
      `, [leaderboard.id])
      leaderboards.push({
        id: leaderboard.id,
        name: leaderboard.name,
        entries: leaderboardEntries,
        userEntry: leaderboardUserEntry,
      })
    }
    return leaderboards
  }
}
