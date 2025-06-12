#!/usr/bin/env python3
"""
Codebase to Text Converter for NotebookLM
This script converts an entire codebase into a comprehensive text file
that can be easily understood by NotebookLM or other AI tools.
"""

import os
import fnmatch
from pathlib import Path
from datetime import datetime


def should_ignore_file(file_path, ignore_patterns):
    """Check if a file should be ignored based on patterns."""
    file_name = os.path.basename(file_path)
    file_path_str = str(file_path)
    
    for pattern in ignore_patterns:
        if fnmatch.fnmatch(file_name, pattern) or fnmatch.fnmatch(file_path_str, pattern):
            return True
    return False


def should_ignore_directory(dir_path, ignore_dirs):
    """Check if a directory should be ignored."""
    dir_name = os.path.basename(dir_path)
    return dir_name in ignore_dirs


def get_file_type(file_path):
    """Determine file type based on extension."""
    ext = Path(file_path).suffix.lower()
    
    type_mapping = {
        '.js': 'JavaScript',
        '.json': 'JSON',
        '.md': 'Markdown',
        '.txt': 'Text',
        '.sql': 'SQL',
        '.py': 'Python',
        '.env': 'Environment',
        '.gitignore': 'Git Ignore',
        '.yml': 'YAML',
        '.yaml': 'YAML',
        '.xml': 'XML',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript JSX',
        '.jsx': 'JavaScript JSX',
        '.php': 'PHP',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.h': 'C Header',
        '.go': 'Go',
        '.rs': 'Rust',
        '.rb': 'Ruby',
        '.kt': 'Kotlin',
        '.swift': 'Swift',
        '.dart': 'Dart',
        '.vue': 'Vue',
        '.svelte': 'Svelte',
        '.dockerfile': 'Dockerfile',
        '.sh': 'Shell Script',
        '.bat': 'Batch Script',
        '.ps1': 'PowerShell',
    }
    
    return type_mapping.get(ext, 'Unknown')


def read_file_safely(file_path):
    """Read file content safely with encoding detection."""
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"Error reading file: {str(e)}"
    
    return "Could not read file - encoding issues"


def analyze_codebase_structure(root_path, ignore_dirs, ignore_patterns):
    """Analyze the codebase structure."""
    structure = {}
    file_counts = {}
    
    for root, dirs, files in os.walk(root_path):
        # Remove ignored directories
        dirs[:] = [d for d in dirs if not should_ignore_directory(os.path.join(root, d), ignore_dirs)]
        
        rel_root = os.path.relpath(root, root_path)
        if rel_root == '.':
            rel_root = 'root'
        
        structure[rel_root] = []
        
        for file in files:
            file_path = os.path.join(root, file)
            if not should_ignore_file(file_path, ignore_patterns):
                file_type = get_file_type(file_path)
                structure[rel_root].append({
                    'name': file,
                    'type': file_type,
                    'size': os.path.getsize(file_path)
                })
                
                # Count file types
                file_counts[file_type] = file_counts.get(file_type, 0) + 1
    
    return structure, file_counts


def convert_codebase_to_text(root_path, output_file='codebase_documentation.txt'):
    """Convert entire codebase to a single text file."""
    
    # Files and directories to ignore
    ignore_dirs = {
        'node_modules', '.git', '__pycache__', '.pytest_cache', 
        'dist', 'build', '.next', '.nuxt', 'target', 'bin', 'obj',
        '.vscode', '.idea', 'vendor', 'coverage', '.nyc_output',
        'uploads', 'logs', 'tmp', 'temp', '.cache'
    }
    
    ignore_patterns = [
        '*.log', '*.tmp', '*.temp', '*.cache', '*.pid', '*.lock',
        '*.stackdump', 'package-lock.json', 'yarn.lock', '*.min.js',
        '*.min.css', '*.map', '*.exe', '*.dll', '*.so', '*.dylib',
        '*.zip', '*.tar.gz', '*.rar', '*.7z', '*.pdf', '*.doc',
        '*.docx', '*.xls', '*.xlsx', '*.ppt', '*.pptx', '*.jpg',
        '*.jpeg', '*.png', '*.gif', '*.svg', '*.ico', '*.mp3',
        '*.mp4', '*.avi', '*.mov', '*.wav', '*.flac'
    ]
    
    print(f"🔍 Analyzing codebase structure...")
    structure, file_counts = analyze_codebase_structure(root_path, ignore_dirs, ignore_patterns)
    
    print(f"📝 Converting codebase to text file: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as out_file:
        # Write header
        out_file.write("=" * 80 + "\n")
        out_file.write("CODEBASE DOCUMENTATION FOR NOTEBOOKLM\n")
        out_file.write("=" * 80 + "\n")
        out_file.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        out_file.write(f"Project root: {os.path.abspath(root_path)}\n")
        out_file.write("=" * 80 + "\n\n")
        
        # Write project overview
        out_file.write("PROJECT OVERVIEW\n")
        out_file.write("-" * 40 + "\n")
        out_file.write("This appears to be a TumbuhNyata Backend API project - a Node.js/Express application\n")
        out_file.write("for managing CSR (Corporate Social Responsibility), carbon emissions tracking,\n")
        out_file.write("certifications, workshops, and notifications for companies.\n\n")
        
        # Write file statistics
        out_file.write("FILE STATISTICS\n")
        out_file.write("-" * 40 + "\n")
        total_files = sum(file_counts.values())
        out_file.write(f"Total files processed: {total_files}\n\n")
        
        for file_type, count in sorted(file_counts.items()):
            out_file.write(f"{file_type:20}: {count:3} files\n")
        out_file.write("\n")
        
        # Write directory structure
        out_file.write("DIRECTORY STRUCTURE\n")
        out_file.write("-" * 40 + "\n")
        for directory, files in sorted(structure.items()):
            if files:  # Only show directories with files
                out_file.write(f"📁 {directory}/\n")
                for file_info in sorted(files, key=lambda x: x['name']):
                    size_kb = file_info['size'] / 1024
                    out_file.write(f"   📄 {file_info['name']} ({file_info['type']}, {size_kb:.1f} KB)\n")
                out_file.write("\n")
        
        out_file.write("\n" + "=" * 80 + "\n")
        out_file.write("COMPLETE SOURCE CODE\n")
        out_file.write("=" * 80 + "\n\n")
        
        # Process files by category for better organization
        categories = {
            'Configuration & Setup': ['package.json', '.env', '.gitignore', 'app.js'],
            'Database Models': [],
            'Controllers': [],
            'Routes': [],
            'Middleware': [],
            'Documentation': ['README.md', 'README-notification.md'],
            'Database Scripts': [],
            'Other Files': []
        }
        
        # Walk through files and categorize them
        processed_files = set()
        
        for root, dirs, files in os.walk(root_path):
            # Remove ignored directories
            dirs[:] = [d for d in dirs if not should_ignore_directory(os.path.join(root, d), ignore_dirs)]
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_path)
                
                if should_ignore_file(file_path, ignore_patterns):
                    continue
                
                # Categorize files
                if file in categories['Configuration & Setup']:
                    categories['Configuration & Setup'].append(rel_path)
                elif 'models' in rel_path:
                    categories['Database Models'].append(rel_path)
                elif 'controllers' in rel_path:
                    categories['Controllers'].append(rel_path)
                elif 'routes' in rel_path:
                    categories['Routes'].append(rel_path)
                elif 'middleware' in rel_path:
                    categories['Middleware'].append(rel_path)
                elif file.endswith('.md'):
                    categories['Documentation'].append(rel_path)
                elif file.endswith('.sql'):
                    categories['Database Scripts'].append(rel_path)
                else:
                    categories['Other Files'].append(rel_path)
        
        # Write files by category
        for category, file_list in categories.items():
            if not file_list:
                continue
                
            out_file.write(f"\n{'=' * 20} {category.upper()} {'=' * 20}\n\n")
            
            # Remove duplicates and sort
            unique_files = list(set(file_list))
            unique_files.sort()
            
            for rel_file_path in unique_files:
                if rel_file_path in categories['Configuration & Setup'][:4]:  # Skip the added ones
                    continue
                    
                full_file_path = os.path.join(root_path, rel_file_path)
                
                if not os.path.exists(full_file_path):
                    continue
                    
                file_type = get_file_type(full_file_path)
                file_size = os.path.getsize(full_file_path)
                
                out_file.write(f"\n{'─' * 60}\n")
                out_file.write(f"FILE: {rel_file_path}\n")
                out_file.write(f"TYPE: {file_type}\n")
                out_file.write(f"SIZE: {file_size} bytes ({file_size/1024:.1f} KB)\n")
                out_file.write(f"{'─' * 60}\n\n")
                
                # Read and write file content
                content = read_file_safely(full_file_path)
                
                if content.strip():
                    out_file.write(content)
                    out_file.write("\n\n")
                else:
                    out_file.write("[Empty file or could not read content]\n\n")
                
                processed_files.add(rel_file_path)
        
        # Write summary
        out_file.write("\n" + "=" * 80 + "\n")
        out_file.write("SUMMARY\n")
        out_file.write("=" * 80 + "\n")
        out_file.write(f"Total files processed: {len(processed_files)}\n")
        out_file.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        out_file.write("\nThis documentation contains the complete source code of the TumbuhNyata Backend API,\n")
        out_file.write("including all models, controllers, routes, middleware, and configuration files.\n")
        out_file.write("The project is a comprehensive solution for corporate sustainability management.\n")
    
    print(f"✅ Conversion complete! Output saved to: {output_file}")
    print(f"📊 Processed {len(processed_files)} files")
    return output_file


def main():
    """Main function to run the converter."""
    print("🚀 TumbuhNyata Codebase to Text Converter")
    print("=" * 50)
    
    # Get current directory as default
    current_dir = os.getcwd()
    print(f"Current directory: {current_dir}")
    
    # Allow user to specify different directory
    root_path = input(f"Enter project root path (or press Enter to use current directory): ").strip()
    if not root_path:
        root_path = current_dir
    
    if not os.path.exists(root_path):
        print(f"❌ Error: Directory '{root_path}' does not exist!")
        return
    
    # Allow user to specify output file
    output_file = input("Enter output filename (or press Enter for 'tumbuhnyata_codebase.txt'): ").strip()
    if not output_file:
        output_file = 'tumbuhnyata_codebase.txt'
    
    try:
        result_file = convert_codebase_to_text(root_path, output_file)
        print(f"\n🎉 Success! Your codebase has been converted to: {result_file}")
        print("📚 You can now upload this file to NotebookLM for analysis!")
        
    except Exception as e:
        print(f"❌ Error during conversion: {str(e)}")


if __name__ == "__main__":
    main() 