export const SUPABASE_URL = "https://vhdefudjosivafnfopzd.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZGVmdWRqb3NpdmFmbmZvcHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTM0MTMsImV4cCI6MjA5NTUyOTQxM30.NbWQV_UV1byXVXeiOMDSOfSurX450vlPR7I1oliUujo";

export const ADMIN_PASSWORD    = "MSPADMIN1234";
export const EMPLOYEE_PASSWORD = "MSP1234";
export const MSP_WHATSAPP      = "917483593673";
export const MSP_EMAIL         = "mspcardetailingstudio@gmail.com";

// ── Car categories for Foam Wash pricing ──
export const CAR_CATEGORIES = [
  "Hatchback",
  "Sedan",
  "Sedan (Long Boot)",
  "7 Seater / MUV",
  "SUV",
];

// Foam Wash prices by category × source (Customer / Garage)
export const FOAM_WASH_PRICES = {
  customer: {
    "Hatchback":          500,
    "Sedan":              550,
    "Sedan (Long Boot)":  600,
    "7 Seater / MUV":     700,
    "SUV":                600,
  },
  garage: {
    "Hatchback":          300,
    "Sedan":              300,
    "Sedan (Long Boot)":  400,
    "7 Seater / MUV":     400,
    "SUV":                400,
    "Omni / Van":         350,
  },
};

// Services list — prices here are defaults only; actual prices
// are stored per-car-model in Supabase (service_prices table).
export const SERVICES = [
  { id:"foam",      label:"Full Car Foam Wash",     defaultPrice:500  },
  { id:"polish",    label:"Car Polishing",          defaultPrice:3000 },
  { id:"ppf",       label:"PPF Coating",            defaultPrice:80000},
  { id:"ceramic",   label:"Ceramic Coating",        defaultPrice:25000},
  { id:"rub",       label:"Rubbing & Polishing",    defaultPrice:2500 },
  { id:"headlight", label:"Headlight Buffing",      defaultPrice:800  },
  { id:"paint",     label:"Paint Work & Tinkering", defaultPrice:5000 },
];

export const CAR_MODELS = [
  // Maruti Suzuki
  "Maruti Suzuki 800","Maruti Suzuki Alto","Maruti Suzuki Alto K10","Maruti Suzuki Alto 800",
  "Maruti Suzuki Swift","Maruti Suzuki Swift Dzire","Maruti Suzuki Dzire",
  "Maruti Suzuki Baleno","Maruti Suzuki Ciaz","Maruti Suzuki Ignis",
  "Maruti Suzuki Celerio","Maruti Suzuki WagonR","Maruti Suzuki Ertiga",
  "Maruti Suzuki XL6","Maruti Suzuki Brezza","Maruti Suzuki Grand Vitara",
  "Maruti Suzuki Fronx","Maruti Suzuki Invicto","Maruti Suzuki Jimny",
  "Maruti Suzuki Omni","Maruti Suzuki Eeco","Maruti Suzuki Gypsy",
  "Maruti Suzuki Esteem","Maruti Suzuki Zen","Maruti Suzuki Zen Estilo",
  "Maruti Suzuki Versa","Maruti Suzuki Ritz","Maruti Suzuki Kizashi","Maruti Suzuki S-Cross",
  // Hyundai
  "Hyundai Santro","Hyundai Santro Xing","Hyundai i10","Hyundai Grand i10",
  "Hyundai Grand i10 Nios","Hyundai i20","Hyundai i20 Active","Hyundai Elite i20",
  "Hyundai Aura","Hyundai Verna","Hyundai Elantra","Hyundai Sonata",
  "Hyundai Creta","Hyundai Venue","Hyundai Tucson","Hyundai Santa Fe",
  "Hyundai Alcazar","Hyundai Ioniq 5","Hyundai Kona Electric",
  "Hyundai Getz","Hyundai Accent","Hyundai Terracan","Hyundai Xcent",
  // Tata
  "Tata Nano","Tata Indica","Tata Indigo","Tata Indigo CS","Tata Indigo Marina",
  "Tata Manza","Tata Bolt","Tata Zest","Tata Tiago","Tata Tigor",
  "Tata Altroz","Tata Nexon","Tata Nexon EV","Tata Punch","Tata Punch EV",
  "Tata Harrier","Tata Safari","Tata Safari Storme","Tata Sumo","Tata Sumo Gold",
  "Tata Hexa","Tata Aria","Tata Xenon","Tata Telcoline","Tata Sierra",
  "Tata Estate","Tata Curvv","Tata Curvv EV",
  // Mahindra
  "Mahindra Thar","Mahindra Thar Roxx","Mahindra Scorpio","Mahindra Scorpio N",
  "Mahindra Scorpio Classic","Mahindra XUV700","Mahindra XUV400",
  "Mahindra XUV300","Mahindra XUV400 EV","Mahindra Bolero","Mahindra Bolero Neo",
  "Mahindra Marazzo","Mahindra Alturas G4","Mahindra KUV100",
  "Mahindra e2o","Mahindra e-Verito","Mahindra Jeeto","Mahindra Xylo",
  "Mahindra Quanto","Mahindra Rexton","Mahindra Logan","Mahindra Verito",
  "Mahindra BE 6","Mahindra XEV 9e",
  // Toyota
  "Toyota Innova","Toyota Innova Crysta","Toyota Innova HyCross",
  "Toyota Fortuner","Toyota Fortuner Legender","Toyota Land Cruiser",
  "Toyota Camry","Toyota Corolla","Toyota Corolla Altis","Toyota Glanza",
  "Toyota Urban Cruiser","Toyota Urban Cruiser Hyryder","Toyota Rumion",
  "Toyota Etios","Toyota Etios Liva","Toyota Etios Cross","Toyota Yaris",
  "Toyota Prius","Toyota Vellfire","Toyota Hilux","Toyota Qualis",
  // Honda
  "Honda City","Honda City Hybrid","Honda Amaze","Honda Jazz","Honda WR-V",
  "Honda Elevate","Honda CR-V","Honda BR-V","Honda HR-V",
  "Honda Accord","Honda Civic","Honda Brio","Honda Mobilio",
  // Kia
  "Kia Seltos","Kia Sonet","Kia Carens","Kia EV6","Kia Carnival",
  // Renault
  "Renault Kwid","Renault Kiger","Renault Triber","Renault Duster",
  "Renault Captur","Renault Lodgy","Renault Scala","Renault Fluence","Renault Koleos",
  // Nissan
  "Nissan Magnite","Nissan Kicks","Nissan Terrano","Nissan Micra",
  "Nissan Sunny","Nissan GT-R","Nissan Teana","Nissan X-Trail",
  // Volkswagen
  "Volkswagen Polo","Volkswagen Vento","Volkswagen Taigun","Volkswagen Virtus",
  "Volkswagen Tiguan","Volkswagen T-Roc","Volkswagen Passat","Volkswagen Ameo",
  // Skoda
  "Skoda Kushaq","Skoda Slavia","Skoda Kodiaq","Skoda Octavia",
  "Skoda Superb","Skoda Rapid","Skoda Yeti","Skoda Fabia",
  // Ford
  "Ford Figo","Ford Figo Aspire","Ford Freestyle","Ford EcoSport",
  "Ford Endeavour","Ford Mustang","Ford Ikon","Ford Fusion","Ford Fiesta","Ford Mondeo",
  // MG
  "MG Hector","MG Hector Plus","MG Gloster","MG ZS EV","MG Astor",
  "MG Comet EV","MG Windsor EV","MG Cyberster",
  // Jeep
  "Jeep Compass","Jeep Meridian","Jeep Wrangler","Jeep Grand Cherokee",
  // BMW
  "BMW 3 Series","BMW 5 Series","BMW 7 Series","BMW X1","BMW X3",
  "BMW X5","BMW X7","BMW M3","BMW M5","BMW 2 Series Gran Coupe","BMW iX","BMW i4",
  // Mercedes-Benz
  "Mercedes-Benz A-Class","Mercedes-Benz C-Class","Mercedes-Benz E-Class",
  "Mercedes-Benz S-Class","Mercedes-Benz GLA","Mercedes-Benz GLC",
  "Mercedes-Benz GLE","Mercedes-Benz GLS","Mercedes-Benz EQS","Mercedes-Benz EQB",
  // Audi
  "Audi A4","Audi A6","Audi A8","Audi Q3","Audi Q5","Audi Q7","Audi Q8",
  "Audi e-tron","Audi RS5","Audi TT",
  // Others
  "Fiat Punto","Fiat Linea","Fiat Avventura",
  "Chevrolet Beat","Chevrolet Cruze","Chevrolet Spark","Chevrolet Tavera","Chevrolet Captiva","Chevrolet Trailblazer",
  "Mitsubishi Pajero","Mitsubishi Outlander","Mitsubishi Eclipse Cross","Mitsubishi Cedia",
  "Isuzu D-Max","Isuzu MU-X","Isuzu MU-7",
  "Citroen C3","Citroen C3 Aircross","Citroen C5 Aircross","Citroen eC3",
  "Porsche Cayenne","Porsche Macan","Porsche 911","Porsche Panamera","Porsche Taycan",
  "Land Rover Defender","Land Rover Discovery","Land Rover Range Rover","Land Rover Freelander",
  "Volvo XC40","Volvo XC60","Volvo XC90","Volvo S60","Volvo S90",
  "Lamborghini Huracan","Lamborghini Urus","Ferrari Roma","Ferrari Portofino",
  "Other"
];

export const STATUS_META = {
  Queued:        { dot:"bg-slate-400",   badge:"bg-slate-700 text-slate-200"     },
  "In Progress": { dot:"bg-blue-400",    badge:"bg-blue-900 text-blue-200"       },
  Completed:     { dot:"bg-emerald-400", badge:"bg-emerald-900 text-emerald-200" },
  Delivered:     { dot:"bg-violet-400",  badge:"bg-violet-900 text-violet-200"   },
};

export const fmt     = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
export const todayStr = () => new Date().toISOString().split("T")[0];

export const sb = async (path, opts={}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
