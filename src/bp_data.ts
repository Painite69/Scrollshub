import type { BPWeek, BPGoal } from './types/battle_pass'

// ─── Battle Pass Weeks ────────────────────────────────────────────────────────
// Site owner defines these. IDs must be stable forever.

export const BP_WEEKS: BPWeek[] = [
  {
    weekNumber: 1,
    quests: [
      // Free quests
      { id: 'w1_q1', title: 'Battlepass Preview', text: 'Use command /preview!', icon: '/mc_assets/WRITABLE_BOOK.png', isPremium: false, stages: null, amount: 1, counter: 0, completed: false },
      { id: 'w1_q2', title: 'Frozen Fortune',text: 'Smelt 2500 Gold Ingots.', icon: '/mc_assets/GOLD_INGOT.png', isPremium: false, stages: null, amount: 2500, counter: 0, completed: false },
      { id: 'w1_q3', title: 'Snowball Fight', text: 'Throw 1500 Snowballs.', icon: '/mc_assets/SNOWBALL.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w1_q4', title: 'Ice Breaker', text: 'Break 7500 Packed Ice.', icon: '/mc_assets/PACKED_ICE.png', isPremium: false, stages: null, amount: 7500, counter: 0, completed: false },
      { id: 'w1_q5', title: 'Naughty or Nice', text: 'Craft 5184 Paper.', icon: '/mc_assets/PAPER.png', isPremium: false, stages: null, amount: 5184, counter: 0, completed: false },
      { id: 'w1_q6', title: 'Master Angler', text: 'Participate in 50 Fishing Contests.', icon: '/mc_assets/FISHING_ROD.png', isPremium: false, stages: null, amount: 50, counter: 0, completed: false },
      { id: 'w1_q7', title: 'Frstive Threads', text: 'Complete all 3 Steps:', icon: '/mc_assets/WHITE_CARPET.png', isPremium: false, 
        stages: [
          { id: 'w1_q7_s1', title: '', text: 'Craft 1728 Red Carpet.', icon: '/mc_assets/RED_CARPET.png', amount: 1728, counter: 0, completed: false },
          { id: 'w1_q7_s2', title: '', text: 'Craft 1728 White Carpet.', icon: '/mc_assets/WHITE_CARPET.png', amount: 1728, counter: 0, completed: false },
          { id: 'w1_q7_s3', title: '', text: 'Craft 1728 Green Carpet.', icon: '/mc_assets/GREEN_CARPET.png', amount: 1728, counter: 0, completed: false },
        ],
        amount: 0, counter: 0, completed: false },
      // Premium quests
      { id: 'w1_p1', title: 'Freezing Frenzy', text: 'Apply Ice Aspect to any item.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
      { id: 'w1_p2', title: 'Ice Maker', text: 'Craft 250 Blue Ice.', icon: '/mc_assets/BLUE_ICE.png', isPremium: true, stages: null, amount: 250, counter: 0, completed: false },
      { id: 'w1_p3', title: 'Jingle all the Way', text: 'Ring a bell 2500 times.', icon: '/mc_assets/BELL.png', isPremium: true, stages: null, amount: 2500, counter: 0, completed: false },
      { id: 'w1_p4', title: 'Arctic Angler', text: 'Gain 10,000 experience in the Angler Job.', icon: '/mc_assets/FISHING_ROD.png', isPremium: true, stages: null, amount: 10000, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 2,
    quests: [
      // Free quests
      { id: 'w2_q1', title: 'Frozen Treads', text: 'Craft 2000 Chains.', icon: '/mc_assets/IRON_CHAIN.png', isPremium: false, stages: null, amount: 2000, counter: 0, completed: false },
      { id: 'w2_q2', title: 'Frozen Footpath', text: 'Convert Dirt or Grass to Path Blocks 1500 times.', icon: '/mc_assets/DIRT_PATH.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w2_q3', title: 'Snow Mercy', text: 'Kill 750 Snow Golems.', icon: '/mc_assets/SNOW_GOLEM.png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w2_q4', title: 'Winter Warmer', text: 'Kill 1250 Blaze.', icon: '/mc_assets/BLAZE.png', isPremium: false, stages: null, amount: 1250, counter: 0, completed: false },
      { id: 'w2_q5', title: 'Glow in the Snowh', text: 'Craft 400 Lanterns.', icon: '/mc_assets/LANTERN.png', isPremium: false, stages: null, amount: 400, counter: 0, completed: false },
      { id: 'w2_q6', title: 'Tree-mendous Timber', text: 'Place 1500 Spruce Logs', icon: '/mc_assets/SPRUCE_LOG.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w2_q7', title: 'Arctic Armor', text: 'Enchant 50 Diamon Chestplates with Protection IV at an Anvil.', icon: '/mc_assets/DIAMOND_CHESTPLATE.png', isPremium: false, stages: null, amount: 50, counter: 0, completed: false },
      // Premium quests
      { id: 'w2_p1', title: 'Frostfire', text: 'Craft 750 Blaze Powder.', icon: '/mc_assets/BLAZE_POWDER.png', isPremium: true, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w2_p2', title: 'A Little PICK Me Up!', text: 'Apply Replenish to any pickaxe.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
      { id: 'w2_p3', title: 'Winter Wisdom', text: 'Gain 1,500 Ecperience.', icon: '/mc_assets/EXPERIENCE_BOTTLE.png', isPremium: true, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w2_p4', title: 'Snowman Essentials', text: 'Craft 750 Polished Blackstone Buttons.', icon: '/mc_assets/POLISHED_BLACKSTONE_BUTTON.png', isPremium: true, stages: null, amount: 750, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 3,
    quests: [
      // Free quests
      { id: 'w3_q1', title: 'Frozen Bones', text: 'Kill 750 Stray', icon: '/mc_assets/STRAY.png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w3_q2', title: 'Cooking Up a Storm', text: 'Craft 600 Smokers.', icon: '/mc_assets/SMOKER.png', isPremium: false, stages: null, amount: 600, counter: 0, completed: false },
      { id: 'w3_q3', title: 'Warp up Warm', text: 'Enchant 50 Leather Chestplates on an enchanting table.', icon: '/mc_assets/LEATHER_CHESTPLATE.png', isPremium: false, stages: null, amount: 50, counter: 0, completed: false },
      { id: 'w3_q6', title: 'Warm Winter Sleep', text: 'Craft 300 White Beds.', icon: '/mc_assets/WHITE_BED.png', isPremium: false, stages: null, amount: 300, counter: 0, completed: false },
      { id: 'w3_q4', title: 'Cold Snap!', text: 'Break 25 Flint and Steel through durability use.', icon: '/mc_assets/FLINT_AND_STEEL.png', isPremium: false, stages: null, amount: 25, counter: 0, completed: false },
      { id: 'w3_q5', title: 'Winter Compass', text: 'Craft 600 lodestone.', icon: '/mc_assets/LODESTONE.png', isPremium: false, stages: null, amount: 600, counter: 0, completed: false },
      { id: 'w1_q7', title: 'Campfire Starter Pack', text: 'Complete all 3 Steps:', icon: '/mc_assets/CAMPFIRE.png', isPremium: false, 
        stages: [
          { id: 'w3_q7_s1', title: '', text: 'Mine 500 Coal Ore.', icon: '/mc_assets/COAL_ORE.png', amount: 500, counter: 0, completed: false },
          { id: 'w3_q7_s2', title: '', text: 'Craft 250 Bricks (Blocks).', icon: '/mc_assets/BRICKS.png', amount: 250, counter: 0, completed: false },
          { id: 'w3_q7_s3', title: '', text: 'Craft 250 Campfires.', icon: '/mc_assets/CAMPFIRE.png', amount: 250, counter: 0, completed: false },
        ],
        amount: 0, counter: 0, completed: false },
      // Premium quests
      { id: 'w3_p1', title: 'Snowy Slumber Spot', text: 'Place 75 White Beds.', icon: '/mc_assets/WHITE_BED.png', isPremium: true, stages: null, amount: 75, counter: 0, completed: false },
      { id: 'w3_p2', title: 'Snowbound Supplies', text: 'Craft 50 Bundles.', icon: '/mc_assets/BUNDLE.png', isPremium: true, stages: null, amount: 50, counter: 0, completed: false },
      { id: 'w3_p3', title: 'Glacial Guide!', text: 'Craft 128 Compass.', icon: '/mc_assets/COMPASS.png', isPremium: true, stages: null, amount: 128, counter: 0, completed: false },
      { id: 'w3_p4', title: 'Northern Lights!', text: 'Apply Glowing to any helmet.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 4,
    quests: [
      // Free quests
      { id: 'w4_q1', title: 'Keeping the Fires Burning', text: 'Make 500 charcoals by smelting logs.', icon: '/mc_assets/CHARCOAL.png', isPremium: false, stages: null, amount: 500, counter: 0, completed: false },
      { id: 'w4_q2', title: 'Glacial Glow', text: 'Craft 250 Candles.', icon: '/mc_assets/RED_CANDLE.png', isPremium: false, stages: null, amount: 250, counter: 0, completed: false },
      { id: 'w4_q3', title: 'Melt the Frost', text: 'Empty 1500 Buckets of Lava.', icon: '/mc_assets/LAVA_BUCKET.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w4_q4', title: 'Cold Storage', text: 'Craft 1500 Barrels.', icon: '/mc_assets/BARREL.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w4_q5', title: 'Frozen Foe', text: 'Kill 750 Polar Bears.', icon: '/mc_assets/POLAR_BEAR.png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w4_q6', title: 'Snowbound Precision', text: 'Enchant 75 Diamond Shovels with Silk Touch at an Anvil.', icon: '/mc_assets/DIAMOND_SHOVEL.png', isPremium: false, stages: null, amount: 75, counter: 0, completed: false },
      { id: 'w4_q7', title: 'Holiday Flowers', text: 'Place 256 TorchesFlowers.', icon: '/mc_assets/TORCHFLOWER.png', isPremium: false, stages: null, amount: 256, counter: 0, completed: false },
      // Premium quests
      { id: 'w4_p1', title: 'Snow Many Feathers', text: 'Kill 500 Chickens.', icon: '/mc_assets/CHICKEN (2).png', isPremium: true, stages: null, amount: 500, counter: 0, completed: false },
      { id: 'w4_p2', title: 'Restore the Freeze', text: 'Empty 1500 Buckets of Powdered Snow.', icon: '/mc_assets/POWDER_SNOW_BUCKET.png', isPremium: true, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w4_p3', title: 'Warm Treads!', text: 'Apply Fire Resistant to any boots', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
      { id: 'w4_p4', title: 'Blizzard Bait', text: 'Fish 300 fish (any vanilla type).', icon: '/mc_assets/FISHING_ROD.png', isPremium: true, stages: null, amount: 300, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 5,
    quests: [
      // Free quests
      { id: 'w5_q1', title: 'The Cold Necessity', text: 'Kill 750 Rabbits.', icon: '/mc_assets/RABBIT (2).png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w5_q2', title: 'Snowstack', text: 'Craft 1500 Snow Blocks.', icon: '/mc_assets/SNOW_BLOCK.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w5_q3', title: 'Snowflake Drift', text: 'Glide 8000 Blocks using an Elytra.', icon: '/mc_assets/ELYTRA.png', isPremium: false, stages: null, amount: 8000, counter: 0, completed: false },
      { id: 'w5_q4', title: 'Blizzard Beacons', text: 'Place 750 End Rods.', icon: '/mc_assets/END_ROD.png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w5_q5', title: 'Frosty Ploughing', text: 'Craft 750 Pistons.', icon: '/mc_assets/PISTON.png', isPremium: false, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w5_q6', title: 'Slippn and Slidin', text: 'Sprint on Ice for 10,000 Blocks.', icon: '/mc_assets/ICE.png', isPremium: false, stages: null, amount: 10000, counter: 0, completed: false },
      { id: 'w5_q7', title: 'The Ultimate Hot Chocolate', text: 'Complete all 3 steps:', icon: '/mc_assets/COCOA_BEANS.png', isPremium: false, 
        stages: [
          { id: 'w5_q7_s1', title: '', text: 'Fill 250 Buckets of Milk', icon: '/mc_assets/MILK_BUCKET.png', amount: 250, counter: 0, completed: false },
          { id: 'w5_q7_s2', title: '', text: 'Harvest 250 Cocoa Beans.', icon: '/mc_assets/COCOA_BEANS.png', amount: 250, counter: 0, completed: false },
          { id: 'w5_q7_s3', title: '', text: 'Craft 250 Sugar.', icon: '/mc_assets/SUGAR.png', amount: 250, counter: 0, completed: false },
        ],
        amount: 0, counter: 0, completed: false },
      // Premium quests
      { id: 'w5_p1', title: 'Winter Pelt', text: 'Craft 200 Leather.', icon: '/mc_assets/LEATHER.png', isPremium: true, stages: null, amount: 200, counter: 0, completed: false },
      { id: 'w5_p2', title: 'Fake Snow', text: 'Craft 500 White Concrete.', icon: '/mc_assets/WHITE_CONCRETE.png', isPremium: true, stages: null, amount: 500, counter: 0, completed: false },
      { id: 'w5_p3', title: 'A Warming Glow', text: 'Break 300 Glow Berry Vines.', icon: '/mc_assets/GLOW_BERRIES.png', isPremium: true, stages: null, amount: 300, counter: 0, completed: false },
      { id: 'w5_p4', title: 'Frozen Bounty!', text: 'Apply Farmers Touch to any axe.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 6,
    quests: [
      // Free quests
      { id: 'w6_q1', title: 'Cold Water Plunge', text: 'Swim 15,000 Blocks.', icon: '/mc_assets/WATER_BUCKET.png', isPremium: false, stages: null, amount: 15000, counter: 0, completed: false },
      { id: 'w6_q2', title: "Wait, this isn't Snow?", text: 'Place 1500 White Concrete.', icon: '/mc_assets/WHITE_CONCRETE.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w6_q3', title: 'Cold Weather Companions', text: 'Tame 250 Wolves.', icon: '/mc_assets/WOLF.png', isPremium: false, stages: null, amount: 250, counter: 0, completed: false },
      { id: 'w6_q4', title: 'Frosty Foundations', text: 'Gain 25000 Experience in the Excavator Job.', icon: '/mc_assets/NETHERITE_SHOVEL.png', isPremium: false, stages: null, amount: 25000, counter: 0, completed: false },
      { id: 'w6_q5', title: 'Shattering The Whither', text: 'Kill 35 Whithers.', icon: '/mc_assets/WITHER.png', isPremium: false, stages: null, amount: 35, counter: 0, completed: false },
      { id: 'w6_q6', title: 'Holiday Metalwork', text: 'Smelt 2500 Copper.', icon: '/mc_assets/RAW_COPPER.png', isPremium: false, stages: null, amount: 2500, counter: 0, completed: false },
      { id: 'w6_q7', title: 'Glacial Gems', text: 'Mine 300 Diamond Ores.', icon: '/mc_assets/DIAMOND_ORE.png', isPremium: false, stages: null, amount: 300, counter: 0, completed: false },
      // Premium quests
      { id: 'w6_p1', title: 'Chilled to the Bone', text: 'Kill 1250 Skeletons (any type).', icon: '/mc_assets/SKELETON.png', isPremium: true, stages: null, amount: 1250, counter: 0, completed: false },
      { id: 'w6_p2', title: 'Dark Winter nights', text: 'Craft 400 Glowstone.', icon: '/mc_assets/GLOWSTONE.png', isPremium: true, stages: null, amount: 400, counter: 0, completed: false },
      { id: 'w6_p3', title: 'Pawsitivily Protected', text: 'Craft 75 Wolf Armor.', icon: '/mc_assets/WOLF_ARMOR.png', isPremium: true, stages: null, amount: 75, counter: 0, completed: false },
      { id: 'w6_p4', title: 'Perfect Vision', text: 'Apply Clear Sight to any Helmet.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
    ],
  },
  {
    weekNumber: 7,
    quests: [
      // Free quests
      { id: 'w7_q1', title: 'Spruce up the Season', text: 'Break 3000 Spruce Leaves.', icon: '/mc_assets/SPRUCE_LEAVES.png', isPremium: false, stages: null, amount: 3000, counter: 0, completed: false },
      { id: 'w7_q2', title: 'Crystal Caves', text: 'Break 800 fully grown Amethyst Clusters.', icon: '/mc_assets/AMETHYST_CLUSTER.png', isPremium: false, stages: null, amount: 800, counter: 0, completed: false },
      { id: 'w7_q3', title: "Winter's Remedy", text: 'Brew 250 Potions of Healing.', icon: '/mc_assets/POTION.png', isPremium: false, stages: null, amount: 250, counter: 0, completed: false },
      { id: 'w7_q4', title: 'A Frozen Playground.', text: 'Place 1500 Ice (any type).', icon: '/mc_assets/ICE.png', isPremium: false, stages: null, amount: 1500, counter: 0, completed: false },
      { id: 'w7_q5', title: 'Tundra Trimmings', text: 'Break 1000 Ferns', icon: '/mc_assets/FERN.png', isPremium: false, stages: null, amount: 1000, counter: 0, completed: false },
      { id: 'w7_q6', title: 'A Frosty Challenge', text: 'Kill the Ancient Defender boss 3 times. (/boss)', icon: '/mc_assets/NETHERITE_SWORD.png', isPremium: false, stages: null, amount: 3, counter: 0, completed: false },
      { id: 'w7_q7', title: 'Snow Much Crafting!', text: 'Complete all 3 steps:', icon: '/mc_assets/GLASS_PANE.png', isPremium: false, 
        stages: [
          { id: 'w7_q7_s1', title: '', text: 'Craft 1750 White Glass Pane.', icon: '/mc_assets/WHITE_STAINED_GLASS_PANE.png', amount: 1750, counter: 0, completed: false },
          { id: 'w7_q7_s2', title: '', text: 'Craft 1750 Light Blue Glass Pane.', icon: '/mc_assets/LIGHT_BLUE_STAINED_GLASS_PANE.png', amount: 1750, counter: 0, completed: false },
          { id: 'w7_q7_s3', title: '', text: 'Craft 1750 Purple Glass Pane', icon: '/mc_assets/PURPLE_STAINED_GLASS_PANE.png', amount: 1750, counter: 0, completed: false },
        ],
        amount: 0, counter: 0, completed: false },
      // Premium quests
      { id: 'w7_p1', title: 'Its Tuff Out There', text: 'Mine 600 Tuff Blocks.', icon: '/mc_assets/TUFF.png', isPremium: true, stages: null, amount: 600, counter: 0, completed: false },
      { id: 'w7_p2', title: 'Season for Giving', text: 'Craft 25 Shulker Boxes.', icon: '/mc_assets/SHULKER_BOX.png', isPremium: true, stages: null, amount: 25, counter: 0, completed: false },
      { id: 'w7_p3', title: 'Lumberjack of the North', text: 'Chop 750 Oak or Spruce Logs.', icon: '/mc_assets/OAK_LOG.png', isPremium: true, stages: null, amount: 750, counter: 0, completed: false },
      { id: 'w7_p4', title: 'Surviving the Storms!', text: 'Apply Hardened to any armour piece.', icon: '/mc_assets/BOOK.png', isPremium: true, stages: null, amount: 1, counter: 0, completed: false },
    ],
  },
]

// ─── Battle Pass Goals ────────────────────────────────────────────────────────
// Site owner defines these. IDs must be stable forever.

export const BP_GOALS: BPGoal[] = [
  { id: 'goal_1', title: 'Halfway Point', text: 'Reach tier 90.', icon: '/mc_assets/EXPERIENCE_BOTTLE.png', stages: null, amount: 90, counter: 0, completed: false },
  { id: 'goal_2', title: 'Season 8 Legacy', text: 'Mine 25000 Snow Blocks w/Beach or Pharao Shovels.', icon: '/mc_assets/SNOW_BLOCK.png', stages: null, amount: 25000, counter: 0, completed: false },
  { id: 'goal_3', title: 'Stocking Up', text: 'Harvest 50,000 fully grown crops.', icon: '/mc_assets/NETHERITE_HOE.png', stages: null, amount: 50000, counter: 0, completed: false },
  { id: 'goal_4', title: 'The Extra Mile', text: 'Reach tire 180.', icon: '/mc_assets/EXPERIENCE_BOTTLE.png', stages: null, amount: 180, counter: 0, completed: false },
  { id: 'goal_5', title: 'Forged in The Frost', text: 'Use 30,000 Iron Ingots in crafting recipes.', icon: '/mc_assets/IRON_INGOT.png', stages: null, amount: 30000, counter: 0, completed: false },
  // Stage goal example (future-proofed with null stages for now)
  {
    id: 'goal_6',
    title: "A Winters' Feast",
    text: 'Eat all food from each step.',
    icon: '/mc_assets/APPLE.png',
    stages: [
      { id: 'goal_6_s1', title: '', text: 'Eat 250 Beetroot Soup', icon: '/mc_assets/BEETROOT_SOUP.png', amount: 250, counter: 0, completed: false },
      { id: 'goal_6_s2', title: '', text: 'Eat 5 Mushroom Stew', icon: '/mc_assets/MUSHROOM_STEW.png', amount: 5, counter: 0, completed: false },
      { id: 'goal_6_s3', title: '', text: 'Eat 5 Rabbit Stew', icon: '/mc_assets/RABBIT_STEW.png', amount: 5, counter: 0, completed: false },
      { id: 'goal_6_s4', title: '', text: 'Eat 5 Suspicious Stew', icon: '/mc_assets/SUSPICIOUS_STEW.png', amount: 50, counter: 0, completed: false },
    ],
    amount: 0, // not used for stage goals
    counter: 0,
    completed: false,
  },
  { id: 'goal_7', title: '100% Completion', text: 'Complete all weekly quests.', icon: '/mc_assets/FIREWORK_ROCKET.png', stages: null, amount: 90, counter: 0, completed: false },
]
