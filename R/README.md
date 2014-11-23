This folder contains scripts to prepare connectivity matrix input files for a d3 visualization with myconnectome_d3.

# Input Data Format
You ultimately need to get your data into the json format, with the following structure:

[
{"name":"R-1.1","strength":"0.463|0.466|0.457|0.455|0.469|0.454","image":"roi031.png","order":1,"color":"#ff2700","network":"R Default","connections":["R-1.15","R-1.17","R-3.51","R-3.59","R-7.129","L-1.564"]},
{"name"...}]

Each object has the following fields:
 - name: should correspond to the "group" name eg, "R-1" following by a period, and then the node unique name.  This unique name can be a string or a number, however it should always be the identifier for the node.  So the file above says that the first entry is for node "1" and it is in grouo "R-1." making the full name "R1.1."  The groups determine the coloring and the ordering.  The "order" variable is taken into account when positioning the nodes around the circle, however nodes in the same group (R-1) will also be placed together.
 - strength: is a list of the connectivity (usually a coorelation value of some time) between the node "R1.1" and the connections listed under "connections." These values determine the coloring of the edges in the network.
 - image: should correspond to a url to an image for the node, which will be displayed in the top right when you mouse over the node.
 - order: is the order of the node around the circle.  The counting starts at 1, and goes clockwise.
 - color: is the color that you want the node.
 - network: is the name of the network, and will be displayed in the top right when you mouse over the node.  In the example above, R-1 corresponds to "R Default."
 - connections: Finally, here are the neighbors, which are calculated based on some thresholding (95% percentile in this case).  The naming convention is the same as the "name" variable.

You can generate this file however you want, however we provide a script (make_connectome_json.R) that will take as input a connectivity matrix and meta data, and will help you generate the above.

# Prepare Your Data
1. You need to prepare the following files:
meta.txt: should be a tab separated file of meta data with the following columns
  - order: indexed from zero
  - original_node_number: from a different clustering, if applicable
  - x: the x coordinate of the roi
  - y: the y coordinate of the roi
  - z: the z coordinate of the roi
  - hemisphere: specify "L" or "R"
  - network_name:
  - network_number:

The "order" variable should correspond with the ordering of nodes in your connectivity_matrix.txt (explained below), which should also correspond with the ordering of the nodes around the circle.  If you want to have a different ordering of nodes around the circle from the order in the connectivity matrix, you should add a variable, and specify this variable as the "order" variable in the json file.  The ordering starts from the top and goes clockwise.  For example, for a lateral ordering you might consider sorting by hemisphere, then by network, then by Y location (i.e. front to back of the brain). You would then need to append the left node hemisphere nodes, reversed in order.  This will produce a lateral layout so that the order of the nodes in the files follows exactly the order around the circle.

2. connectivity_matrix.txt: a space separated NxN connectivity matrix, with no column or row labels.  These rows and columns ordering should correspond to the rows in the file above.

# prepMetaData.R
This script will combine your data and meta data files into one json that will be used for the d3 - the meta data of each node is attached to the node in this file, as are the neighbors.  This script will, most importantly, calculate the neighbors based on a threshold (part A) which you should edit if you want a different thresholding.  The d3 will allow for more fine tuned tweaking of this threshold - for example, if we filter to include the 90th percentile of nodes here, the user will be able to increase to only show the 95th, but can not go in the other direction. This file will also attach a particular color to each node depending on the network.  The colors correspond to those from a network analysis done for Poldrack lab by the Peterson lab, and the values are hard coded into the script.



# Edit main.js to point to your data


### INPUT
 - 
The nodes are sorted by hemisphere, then by network, then by Y location (i.e. front to back of the brain). The left hemisphere nodes are reversed in order, so that the order of the nodes in the files follows exactly the order around the circle.

STOPPED HERE - finish writing readme, and then new script to parse data...

specifying "L" or "R" for right or left hemisphere
  - network: should be the network names
  - output: the name of the desired output file, will also be tab separated
  - color: the name of the file that will specify the coloring of the network (based on network variable)


the nodes are sorted by hemisphere, then by network, then by Y location (i.e. front to back of the brain). The left hemisphere nodes are reversed in order, so that the order of the nodes in the files follows exactly the order around the circle.


final_groups: nodes grouped by network, regardless of left or right
# opposite_groups: nodes grouped so left-regionX is opposite in the circle to right-regionX
# lateral_groups: nodes grouped around circle so left-regionX is lateral to right-regionX
#
# INPUT
# meta: should be a tab separated file of meta data with the following column labels:
#   - hemis: specifying "L" or "R" for right or left hemisphere
#   - network: should be the network names
# output: the name of the desired output file, will also be tab separated
# color: the name of the file that will specify the coloring of the network (based on network variable)
#        this is just space separated
# USAGE
#                        meta            output             color
# RSCRIPT prepMetaData.R parcel_data.txt metadata_final.tsv colorfile.txt
