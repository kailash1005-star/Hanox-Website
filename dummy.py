import os
import requests

# List of image URLs provided
urls = [
    "//minibagger-guenstig.de/cdn/shop/files/MinibaggerRippaR10-6inkl.SchnellwechslermitVollausstattung.jpg",
    "//minibagger-guenstig.de/cdn/shop/files/MinibaggerRippaR10-6inkl.SchnellwechslermitVollausstattung_2.jpg",
    "//minibagger-guenstig.de/cdn/shop/files/MinibaggerRippaR10-6inkl.SchnellwechslermitVollausstattung_3.jpg",
    "//minibagger-guenstig.de/cdn/shop/files/MinibaggerRippaR10-6inkl.SchnellwechslermitVollausstattung_4.jpg"
]

def download_images(url_list, output_folder="downloaded_images"):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created folder: {output_folder}")

    for i, url in enumerate(url_list, start=1):
        # Ensure the URL has a proper protocol (https:)
        if url.startswith("//"):
            clean_url = "https:" + url
        else:
            clean_url = url
        
        # Extract the original filename from the URL
        filename = clean_url.split("/")[-1]
        filepath = os.path.join(output_folder, filename)
        
        print(f"Downloading [{i}/{len(url_list)}]: {filename}...")
        
        try:
            # Send a GET request to the URL
            response = requests.get(clean_url, stream=True)
            # Check if the request was successful (Status Code 200)
            response.raise_for_status()
            
            # Write the file in binary mode
            with open(filepath, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
            print(f"Successfully saved to {filepath}")
            
        except requests.exceptions.RequestException as e:
            print(f"Failed to download {clean_url}. Error: {e}")

if __name__ == "__main__":
    download_images(urls)