import React from "react";
import { useRef } from "react";
import { useState } from "react";
import { fetchWeatherApi } from "openmeteo";
import "./App.css";

var data: string[] = [];
var day: string[] = [];
var rainSum: string[] = [];

function App() {
  const inputLatitude = useRef<HTMLInputElement>(null);
  const inputLongitude = useRef<HTMLInputElement>(null);
  const optionSelected = useRef<HTMLSelectElement>(null);
  // const [option, setOption] = useState('react');
  const [message, setMessage] = useState("");
  const [table, setTable] = useState(false);
  var key = 0;

  async function handleWeatherAPI(
    inputLatitude = 0,
    inputLongitude = 0,
    forecastDays = 1
  ) {
    const params = {
      latitude: inputLatitude, //47.1332,
      longitude: inputLongitude, //24.5001,
      current: "is_day",
      hourly: ["temperature_2m", "is_day", "wind_speed_10m"],
      daily: "rain_sum",
      timezone: "auto",
      forecast_days: forecastDays,
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    // Helper function to form time ranges
    const range = (start: number, stop: number, step: number) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    // Attributes for timezone and location
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const latitude = response.latitude();
    const longitude = response.longitude();

    const current = response.current()!;
    const daily = response.daily()!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature2m: current.variables(0)!.value(),
        isDay: current.variables(1)!.value(),
        windSpeed10m: current.variables(2)!.value(),
      },
      daily: {
        time: range(
          Number(daily.time()),
          Number(daily.timeEnd()),
          daily.interval()
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        rainSum: daily.variables(0)!.valuesArray()!,
      },
    };
    data.push(String(longitude));
    data.push(String(latitude));
    data.push(String(timezone));

    // `weatherData` now contains a simple structure with arrays for datetime and weather data
    if (weatherData.current == null && weatherData.daily == null) {
      setMessage("No data found for searched criteria");
      setTable(false);
    } else {
      setTable(true);
      for (let i = 0; i < weatherData.daily.time.length; i++) {
        day.push(weatherData.daily.time[i].toISOString().substring(0, 10));
        rainSum.push(String(weatherData.daily.rainSum[i]));
      }
    }
    data.push(String(weatherData.current.windSpeed10m));
    data.push(String(weatherData.current.isDay));
  }

  function handleClick() {
    let latitude = 0,
      longitude = 0,
      option = 0;
    if (inputLatitude.current !== null) {
      latitude = parseFloat(inputLatitude.current.value);
    }
    if (inputLongitude.current !== null) {
      longitude = parseFloat(inputLongitude.current.value);
    }
    if (optionSelected.current !== null) {
      option = parseInt(optionSelected.current.value);
    }
    handleWeatherAPI(latitude, longitude, option);
  }

  return (
    <>
      <div className="formDetails">
        <form id="homeForm">
          <div className="mb-3">
            <label htmlFor="latitude" className="form-label">
              Latitude
            </label>
            <input
              ref={inputLatitude}
              id="latitude"
              type="text"
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="longitude" className="form-label">
              Longitude
            </label>
            <input
              ref={inputLongitude}
              id="longitude"
              type="text"
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <select
              ref={optionSelected}
              className="form-select"
              aria-label="Default select example"
              // onChange={(event) => setOption(event.target.value)}
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </div>
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleClick}
            >
              Search
            </button>
          </div>
        </form>
      </div>
      {!table && <p>{message}</p>}
      {table && (
        <table className="table table-dark">
          <thead>
            <tr>
              <th scope="col">Longitude</th>
              <th scope="col">Latitude</th>
              <th scope="col">Timezone</th>
              <th scope="col">Date</th>
              <th scope="col">Rain Sum</th>
              <th scope="col">Wind Speed</th>
              <th scope="col">Day/Night</th>
            </tr>
          </thead>
          <tbody>
            {day.map((item) => (
              <tr key={key++}>
                <td>{data[0]}</td>
                <td>{data[1]}</td>
                <td>{data[2]}</td>
                <td>{item}</td>
                <td>{rainSum[key]} mm</td>
                <td>{data[3]} km/h</td>
                <td>{data[4] == "0" ? "Night" : "Day"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default App;
