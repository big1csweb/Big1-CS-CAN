import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  let log = "";
  try {
    const email = "test" + Date.now() + "@test.com";
    const res = await createUserWithEmailAndPassword(auth, email, "password123");
    log += `created auth user ${res.user.uid}\n`;
    
    // Simulate what signup does
    await setDoc(doc(db, "users", res.user.uid), {
      name: "Test User",
      email: email,
      role: "member",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    log += "signup setDoc success\n";
    
    // Simulate what Join.tsx does
    const updatePayload = {
      name: "Test User",
      phone: "1231231234",
      tier: "growth_consultant",
      selectedCoes: ["Setup"],
      professionalStatus: "job",
      professionalDetails: { employer: "qwe", designation: "qwe", experience: "12" },
      experienceMonths: "20",
      whyJoin: "hi",
      documentUrl: "",
      updatedAt: Date.now(),
    };
    
    await updateDoc(doc(db, "users", res.user.uid), updatePayload);
    log += "Join updateDoc success\n";
    
  } catch (err) {
    log += "ERROR: " + err.message + "\n";
  } finally {
    fs.writeFileSync("test.log", log);
    process.exit();
  }
}

test();
