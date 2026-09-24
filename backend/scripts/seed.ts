import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  return uri;
}

const MONGODB_URI = getMongoUri();

const personSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const siteSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
  },
  { timestamps: true },
);

const visitSchema = new mongoose.Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    exists: {
      type: Boolean,
      required: true,
    },
    source: {
      type: String,
      enum: ['address', 'link', 'history'],
      required: true,
    },
  },
  { timestamps: true },
);

const Person = mongoose.model('Person', personSchema);
const Site = mongoose.model('Site', siteSchema);
const Visit = mongoose.model('Visit', visitSchema);

type SeedSite = {
  address: string;
  title: string;
  publisher: string;
  html: string;
};

const people = [
  'Alice Morgan',
  'Ben Carter',
  'Clara Hughes',
  'Daniel Reed',
  'Eva Bennett',
];

const sites: SeedSite[] = [
  {
    address: 'garden.local',
    title: 'The Quiet Garden',
    publisher: 'Alice Morgan',
    html: `
      <article>
        <h1>The Quiet Garden</h1>
        <p>
          A garden changes slowly enough that it rewards attention.
          In spring, new leaves appear almost overnight, while summer
          brings bees, shade, and the smell of warm soil.
        </p>
        <p>
          I keep notes about the plants beside my small collection
          of <a href="herbs.local">kitchen herbs</a>.
        </p>
        <p>
          On rainy afternoons I usually leave the garden and read
          something from the <a href="library.local">neighbourhood library</a>.
        </p>
        <p>
          There is also an old handwritten reference to
          <a href="secret-garden.local">a secret garden</a>, although
          nobody seems to know where it went.
        </p>
      </article>
    `,
  },

  {
    address: 'herbs.local',
    title: 'Notes on Kitchen Herbs',
    publisher: 'Alice Morgan',
    html: `
      <article>
        <h1>Notes on Kitchen Herbs</h1>
        <p>
          Mint grows aggressively, rosemary prefers patience, and basil
          seems happiest when it is harvested often. These notes began
          as a simple record of what survived on my kitchen windowsill.
        </p>
        <p>
          Growing food eventually led me to experiment with recipes in
          the <a href="kitchen.local">small kitchen notebook</a>.
        </p>
        <p>
          For outdoor plants, return to
          <a href="garden.local">the quiet garden</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'library.local',
    title: 'The Neighbourhood Library',
    publisher: 'Ben Carter',
    html: `
      <article>
        <h1>The Neighbourhood Library</h1>
        <p>
          Our library occupies two rooms above an old bakery. The shelves
          are uneven, the chairs do not match, and almost every book has
          been recommended by somebody who lives nearby.
        </p>
        <p>
          The poetry shelf has grown into its own little corner.
          Visit <a href="poetry.local">Poems for Slow Evenings</a>.
        </p>
        <p>
          Travellers often leave notebooks behind, so we also maintain
          a collection of <a href="travel.local">travel stories</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'poetry.local',
    title: 'Poems for Slow Evenings',
    publisher: 'Ben Carter',
    html: `
      <article>
        <h1>Poems for Slow Evenings</h1>
        <p>
          Some poems are best read when there is nowhere else to be.
          This page collects short reflections about rain, empty streets,
          old windows, distant trains, and the quiet end of the day.
        </p>
        <p>
          Many of these pieces were inspired by walks recorded in
          <a href="city.local">City Corners</a>.
        </p>
        <p>
          A former contributor supposedly kept more poems at
          <a href="lost-poems.local">lost-poems.local</a>, but that
          address no longer exists.
        </p>
      </article>
    `,
  },

  {
    address: 'city.local',
    title: 'City Corners',
    publisher: 'Clara Hughes',
    html: `
      <article>
        <h1>City Corners</h1>
        <p>
          Cities are remembered through small places: a bench beneath
          a station clock, a narrow coffee shop, a mural at the end of
          an alley, or a bridge crossed every morning.
        </p>
        <p>
          One of my favourite walks ends at
          <a href="coffee.local">The Corner Coffee Journal</a>.
        </p>
        <p>
          Another route eventually reaches the
          <a href="library.local">neighbourhood library</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'coffee.local',
    title: 'The Corner Coffee Journal',
    publisher: 'Clara Hughes',
    html: `
      <article>
        <h1>The Corner Coffee Journal</h1>
        <p>
          This journal is less about coffee than the conversations that
          happen around it. Early mornings belong to commuters, afternoons
          to students, and evenings to people avoiding the journey home.
        </p>
        <p>
          The café kitchen contributed several ideas to
          <a href="kitchen.local">the kitchen notebook</a>.
        </p>
        <p>
          Visitors planning longer journeys often browse
          <a href="travel.local">travel stories</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'kitchen.local',
    title: 'The Small Kitchen Notebook',
    publisher: 'Daniel Reed',
    html: `
      <article>
        <h1>The Small Kitchen Notebook</h1>
        <p>
          Good home cooking depends less on complicated recipes than on
          repetition. Soup, bread, roasted vegetables, and simple sauces
          become easier when their basic patterns are understood.
        </p>
        <p>
          Fresh ingredients can begin with
          <a href="herbs.local">a few kitchen herbs</a>.
        </p>
        <p>
          Meals also make excellent preparation for
          <a href="travel.local">long journeys</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'travel.local',
    title: 'Stories from the Road',
    publisher: 'Daniel Reed',
    html: `
      <article>
        <h1>Stories from the Road</h1>
        <p>
          The best travel stories are rarely about famous landmarks.
          They are about missed buses, unexpected conversations, small
          meals, wrong turns, and places discovered by accident.
        </p>
        <p>
          Several journeys ended beside the sea, which inspired
          <a href="ocean.local">Notes from the Shore</a>.
        </p>
        <p>
          Back home, familiar streets can be rediscovered through
          <a href="city.local">City Corners</a>.
        </p>
      </article>
    `,
  },

  {
    address: 'ocean.local',
    title: 'Notes from the Shore',
    publisher: 'Eva Bennett',
    html: `
      <article>
        <h1>Notes from the Shore</h1>
        <p>
          The shoreline looks permanent from a distance but changes every
          hour. Tides erase footprints, wind rearranges the sand, and the
          colour of the water follows the weather.
        </p>
        <p>
          Watching these cycles made me think about the larger patterns
          described in <a href="stars.local">The Amateur Sky</a>.
        </p>
        <p>
          An abandoned sign points toward
          <a href="lighthouse.local">an old lighthouse</a>, but its page
          cannot currently be found.
        </p>
      </article>
    `,
  },

  {
    address: 'stars.local',
    title: 'The Amateur Sky',
    publisher: 'Eva Bennett',
    html: `
      <article>
        <h1>The Amateur Sky</h1>
        <p>
          You do not need a telescope to begin learning the night sky.
          Start with the moon, notice where the sun sets, and learn a few
          bright stars that remain recognizable across the seasons.
        </p>
        <p>
          Long nights of observation are easier with something warm from
          <a href="coffee.local">the corner coffee journal</a>.
        </p>
        <p>
          For a completely different kind of observation, visit
          <a href="garden.local">the quiet garden</a>.
        </p>
      </article>
    `,
  },
];

type VisitSeed = {
  person: string;
  address: string;
  exists: boolean;
  source: 'address' | 'link' | 'history';
  minutesAgo: number;
};

const visits: VisitSeed[] = [
  // Alice follows a long trail through much of the Small Web.
  {
    person: 'Alice Morgan',
    address: 'garden.local',
    exists: true,
    source: 'address',
    minutesAgo: 60,
  },
  {
    person: 'Alice Morgan',
    address: 'herbs.local',
    exists: true,
    source: 'link',
    minutesAgo: 56,
  },
  {
    person: 'Alice Morgan',
    address: 'kitchen.local',
    exists: true,
    source: 'link',
    minutesAgo: 51,
  },
  {
    person: 'Alice Morgan',
    address: 'travel.local',
    exists: true,
    source: 'link',
    minutesAgo: 46,
  },
  {
    person: 'Alice Morgan',
    address: 'ocean.local',
    exists: true,
    source: 'link',
    minutesAgo: 41,
  },
  {
    person: 'Alice Morgan',
    address: 'stars.local',
    exists: true,
    source: 'link',
    minutesAgo: 36,
  },
  {
    person: 'Alice Morgan',
    address: 'coffee.local',
    exists: true,
    source: 'link',
    minutesAgo: 31,
  },
  {
    person: 'Alice Morgan',
    address: 'city.local',
    exists: true,
    source: 'address',
    minutesAgo: 26,
  },
  {
    person: 'Alice Morgan',
    address: 'library.local',
    exists: true,
    source: 'link',
    minutesAgo: 21,
  },
  {
    person: 'Alice Morgan',
    address: 'poetry.local',
    exists: true,
    source: 'link',
    minutesAgo: 16,
  },
  {
    person: 'Alice Morgan',
    address: 'lost-poems.local',
    exists: false,
    source: 'link',
    minutesAgo: 11,
  },
  {
    person: 'Alice Morgan',
    address: 'garden.local',
    exists: true,
    source: 'history',
    minutesAgo: 6,
  },

  // Ben revisits several pages.
  {
    person: 'Ben Carter',
    address: 'library.local',
    exists: true,
    source: 'address',
    minutesAgo: 58,
  },
  {
    person: 'Ben Carter',
    address: 'travel.local',
    exists: true,
    source: 'link',
    minutesAgo: 48,
  },
  {
    person: 'Ben Carter',
    address: 'city.local',
    exists: true,
    source: 'link',
    minutesAgo: 38,
  },
  {
    person: 'Ben Carter',
    address: 'coffee.local',
    exists: true,
    source: 'link',
    minutesAgo: 28,
  },
  {
    person: 'Ben Carter',
    address: 'travel.local',
    exists: true,
    source: 'history',
    minutesAgo: 18,
  },

  // Clara encounters a broken address.
  {
    person: 'Clara Hughes',
    address: 'city.local',
    exists: true,
    source: 'address',
    minutesAgo: 54,
  },
  {
    person: 'Clara Hughes',
    address: 'library.local',
    exists: true,
    source: 'link',
    minutesAgo: 44,
  },
  {
    person: 'Clara Hughes',
    address: 'poetry.local',
    exists: true,
    source: 'link',
    minutesAgo: 34,
  },
  {
    person: 'Clara Hughes',
    address: 'lost-poems.local',
    exists: false,
    source: 'link',
    minutesAgo: 24,
  },

  // Daniel explores food and travel.
  {
    person: 'Daniel Reed',
    address: 'kitchen.local',
    exists: true,
    source: 'address',
    minutesAgo: 52,
  },
  {
    person: 'Daniel Reed',
    address: 'herbs.local',
    exists: true,
    source: 'link',
    minutesAgo: 42,
  },
  {
    person: 'Daniel Reed',
    address: 'garden.local',
    exists: true,
    source: 'link',
    minutesAgo: 32,
  },
  {
    person: 'Daniel Reed',
    address: 'secret-garden.local',
    exists: false,
    source: 'link',
    minutesAgo: 22,
  },

  // Eva follows the coast and sky pages.
  {
    person: 'Eva Bennett',
    address: 'ocean.local',
    exists: true,
    source: 'address',
    minutesAgo: 50,
  },
  {
    person: 'Eva Bennett',
    address: 'stars.local',
    exists: true,
    source: 'link',
    minutesAgo: 40,
  },
  {
    person: 'Eva Bennett',
    address: 'garden.local',
    exists: true,
    source: 'link',
    minutesAgo: 30,
  },
  {
    person: 'Eva Bennett',
    address: 'library.local',
    exists: true,
    source: 'link',
    minutesAgo: 20,
  },
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(MONGODB_URI);

  console.log('Connected.');

  /*
   * We intentionally replace the seeded dataset each time.
   * That makes the command deterministic and idempotent:
   * repeated runs produce the same logical dataset instead
   * of duplicating records.
   */
  await Promise.all([
    Visit.deleteMany({}),
    Site.deleteMany({}),
    Person.deleteMany({}),
  ]);

  console.log('Existing seed data cleared.');

  const personIdByName = new Map<string, Types.ObjectId>();

  for (const name of people) {
    const person = await Person.create({ name });
    personIdByName.set(name, person._id);
  }

  console.log(`Created ${people.length} people.`);

  for (const site of sites) {
    const publisherId = personIdByName.get(site.publisher);

    if (!publisherId) {
      throw new Error(`Publisher not found: ${site.publisher}`);
    }

    await Site.create({
      address: site.address,
      title: site.title,
      html: site.html.trim(),
      publisher: publisherId,
    });
  }

  console.log(`Created ${sites.length} sites.`);

  /*
   * Use one fixed reference time so the relative spacing between
   * visits is deterministic within each seed execution.
   */
  const referenceTime = new Date();

  const visitDocuments = visits.map((visit) => {
    const personId = personIdByName.get(visit.person);

    if (!personId) {
      throw new Error(`Person not found: ${visit.person}`);
    }

    const visitedAt = new Date(
      referenceTime.getTime() - visit.minutesAgo * 60 * 1000,
    );

    return {
      person: personId,
      address: visit.address,
      exists: visit.exists,
      source: visit.source,
      createdAt: visitedAt,
      updatedAt: visitedAt,
    };
  });

  await Visit.insertMany(visitDocuments);

  console.log(`Created ${visits.length} visits.`);

  const [personCount, siteCount, visitCount] = await Promise.all([
    Person.countDocuments(),
    Site.countDocuments(),
    Visit.countDocuments(),
  ]);

  console.log('');
  console.log('Seed complete.');
  console.log(`People: ${personCount}`);
  console.log(`Sites: ${siteCount}`);
  console.log(`Visits: ${visitCount}`);
}

seed()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
