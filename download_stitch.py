import urllib.request
import os

screens = {
    "Login_Medis_Profesional.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OWM4NDQ5OTcwOTI1YzczNzg3MGQ2NGUwEgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Dashboard_Orang_Tua.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTNkZDI5MjMwNzNhZTQ1ZTU5MWY4NWRhEgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Grafik_Pertumbuhan.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTNiNThjYjcwOTI1ZDRlZGFiMjBlNWQyEgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Tambah_Pengukuran.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTNkMWExNTUwMWE2MzE2OGQ3MjA4NGMxEgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Dashboard_Admin.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTNmNDdiOWUwMWE2MGU0YTcyMDQxMTg0EgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Analitik_Regional.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTQwODJiZmEwNTIyODJmZWI4MDhiZGQ3EgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Verifikasi_Akun.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTNmZTE4YzEwNTIyODJmZWI4MDhiZGQ3EgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086",
    "Detail_Pasien.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OWI4OTQxMWFlYmQwN2M0ZDE4NmU0MTRhNDgxEgsSBxCOlsyB0QEYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM3NzgzNjkwNjE3NzYxOTYx&filename=&opi=89354086"
}

os.makedirs("stitch_ui", exist_ok=True)
for name, url in screens.items():
    print(f"Downloading {name}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(os.path.join("stitch_ui", name), "wb") as out_file:
                out_file.write(response.read())
    except Exception as e:
        print(f"Failed to download {name}: {e}")
print("Done")
