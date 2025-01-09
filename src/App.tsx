import { Box, Container, Typography } from "@mui/material";
import "./App.css";
import AddHabitForm from "./components/AddHabitForm";
import HabitLists from "./components/HabitLists";
// import useHabitStore from "./store/store";

function App() {
  return (
    <Container>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Habit Tracker
        </Typography>
        {/* Form  */}
        <AddHabitForm />
        {/* Lists  */}
        <HabitLists />
        {/* stats */}
      </Box>
    </Container>
  );
}

export default App;
