import {
  MappedinLocation,
  MappedinMap,
  TGetVenueOptions,
} from "@mappedin/mappedin-js";
import "@mappedin/mappedin-js/lib/mappedin.css";
import { useEffect, useMemo, useRef, useState } from "react";
import useMapView from "./../../hooks/useMapView";
import useVenue from "./../../hooks/useVenue";
import useOfflineSearch from "../../hooks/useOfflineSearch";
import useSelectedLocation from "../../hooks/useSelectedLocation";
import useWayfinding from "../../hooks/useWayfinding";

function Home() {
  const options = useMemo<TGetVenueOptions>(
    () => ({
      venue: "mappedin-demo-mall",
      clientId: "5eab30aa91b055001a68e996",
      clientSecret: "RJyRXKcryCMy4erZqqCbuB1NbR66QTGNXVE0x3Pg6oCIlUR1",
    }),
    []
  );

  const venue = useVenue(options);

  const { elementRef, mapView } = useMapView(venue);

  const { startLocation, endLocation, setStartLocation, setEndLocation } =
    useWayfinding(mapView);

  const [searchQueryStart, setSearchQueryStart] = useState("");
  const [searchQueryEnd, setSearchQueryEnd] = useState("");
  const { selectedLocation, setSelectedLocation } =
    useSelectedLocation(mapView);
  const [maps, setMaps] = useState<MappedinMap[]>([]);

  const resultsStart = useOfflineSearch(venue, searchQueryStart);
  const resultsEnd = useOfflineSearch(venue, searchQueryEnd);

  const searchResultsStart = useMemo(
    () =>
      resultsStart
        .filter((result) => result.type === "MappedinLocation")
        .map((result) => (
          <div
            id="search-result"
            key={(result.object as MappedinLocation).name}
            onClick={() => {
              const location = result.object as MappedinLocation;
              setSelectedLocation(location);
              setStartLocation(location);
              setSearchQueryStart("");
            }}
          >
            {`${result.object.name}`}
          </div>
        )),
    [resultsStart, setSelectedLocation, setStartLocation]
  );

  const searchResultsEnd = useMemo(
    () =>
      resultsEnd
        .filter((result) => result.type === "MappedinLocation")
        .map((result) => (
          <div
            id="search-result"
            key={(result.object as MappedinLocation).name}
            onClick={() => {
              const location = result.object as MappedinLocation;
              setSelectedLocation(location);
              setEndLocation(location);
              setSearchQueryEnd("");
            }}
          >
            {`${result.object.name}`}
          </div>
        )),
    [resultsEnd, setSelectedLocation, setEndLocation]
  );

  const mapGroupSelectRef = useRef<HTMLSelectElement>(null);
  const mapLevelSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    mapView?.addInteractivePolygonsForAllLocations();
    mapView?.FloatingLabels.labelAllLocations();

    const populateMaps = (maps: MappedinMap[]) => {
      if (mapLevelSelectRef.current) {
        mapLevelSelectRef.current.innerHTML = "";
        mapLevelSelectRef.current.onchange = onLevelChange;
        maps.forEach((map) => {
          const option = document.createElement("option");
          option.text = map.name;
          option.value = map.id;
          mapLevelSelectRef.current?.add(option);
        });
        mapLevelSelectRef.current.value = mapView?.currentMap.id || "";
      }
    };

    const populateMapGroups = () => {
      if (mapGroupSelectRef.current) {
        mapGroupSelectRef.current.innerHTML = "";
        venue?.mapGroups.forEach((mg) => {
          const option = document.createElement("option");
          option.value = mg.id;
          option.text = mg.name;
          mapGroupSelectRef.current?.appendChild(option);
        });
        const maps =
          venue?.mapGroups[0]?.maps.sort((a, b) => b.elevation - a.elevation) ||
          [];
        setMaps(maps);
        populateMaps(maps);
      }
    };

    const onLevelChange = (event: Event) => {
      const id = (event.target as HTMLSelectElement).value;
      mapView?.setMap(id);
    };

    mapGroupSelectRef.current?.addEventListener(
      "change",
      async (event: Event) => {
        const mg = venue?.mapGroups.find(
          (mg) => mg.id === mapGroupSelectRef.current?.value
        );
        if (mg) {
          const maps = mg.maps.sort((a, b) => b.elevation - a.elevation);
          const map = maps[maps.length - 1];
          await mapView?.setMap(map);
          setMaps(maps);
        }
      }
    );

    populateMapGroups();
  }, [mapView, venue]);

  const clearAll = () => {
    setStartLocation(undefined);
    setEndLocation(undefined);
    setSearchQueryStart("");
    setSearchQueryEnd("");
    mapView?.Journey.clear(); // Assuming this method clears the drawn path
  };

  return (
    <section className="flex flex-col h-screen">
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <select
            ref={mapGroupSelectRef}
            className="bg-gray-700 text-white p-2 rounded mr-2"
          >
            {venue?.mapGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
          <select
            ref={mapLevelSelectRef}
            className="bg-gray-700 text-white p-2 rounded"
          >
            {maps.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={clearAll}
          className="bg-red-500 text-white p-2 rounded"
        >
          Clear All
        </button>
      </nav>

      <div className="flex-1 flex">
        <aside className="bg-gray-100 w-64 p-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block mb-2">Start Location</label>
            <div className="flex">
              <input
                value={startLocation?.name || ""}
                readOnly
                className="w-full p-2 border border-gray-300 rounded"
              />
              <button
                onClick={() => setStartLocation(undefined)}
                className="bg-red-500 text-white p-2 rounded ml-2"
              >
                X
              </button>
            </div>
            <input
              type="text"
              placeholder="Search for start location"
              value={searchQueryStart}
              onChange={(e) => {
                setSearchQueryStart(e.target.value);
              }}
              className="w-full p-2 mt-2 border border-gray-300 rounded"
            />
            <div className="search-results mt-2">{searchResultsStart}</div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">End Location</label>
            <div className="flex">
              <input
                value={endLocation?.name || ""}
                readOnly
                className="w-full p-2 border border-gray-300 rounded"
              />
              <button
                onClick={() => setEndLocation(undefined)}
                className="bg-red-500 text-white p-2 rounded ml-2"
              >
                X
              </button>
            </div>
            <input
              type="text"
              placeholder="Search for end location"
              value={searchQueryEnd}
              onChange={(e) => {
                setSearchQueryEnd(e.target.value);
              }}
              className="w-full p-2 mt-2 border border-gray-300 rounded"
            />
            <div className="search-results mt-2">{searchResultsEnd}</div>
          </div>
        </aside>

        <main className="flex-1 relative">
          <div ref={elementRef} className="w-full h-[100vh]" />
        </main>
      </div>
    </section>
  );
}

export default Home;
