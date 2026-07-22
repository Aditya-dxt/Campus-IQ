import numpy as np
import pandas as pd
from test_train_split import train_test_split
from standardization import standardize
from train import train
from sigmoid import sigmoid
from log_loss import average_log_loss

df = pd.read_csv(r"C:\Users\DELL\Downloads\student_risk_data.csv")
X = df[['attendance_pct', 'submission_rate_pct', 'activity_log_count']].values
y = df['at_risk'].values 


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)


X_train_scaled, X_test_scaled = standardize(X_train, X_test)


weights = np.zeros(X_train_scaled.shape[1])
b = 0.0
final_weights, final_b = train(X_train_scaled, y_train, weights, b, alpha=0.1, epochs=1000)

z_test = X_test_scaled @ final_weights + final_b
y_hat_test = sigmoid(z_test)
test_loss = average_log_loss(y_test, y_hat_test)
print("Test Loss:", test_loss)

predictions = (y_hat_test >= 0.5).astype(int)
accuracy = (np.mean(predictions == y_test))
print("Test Accuracy:", accuracy)

TP = np.sum((predictions == 1) & (y_test == 1))
TN = np.sum((predictions == 0) & (y_test == 0))
FP = np.sum((predictions == 1) & (y_test == 0))
FN = np.sum((predictions == 0) & (y_test == 1))
precision = (TP/(TP+FP))
recall = (TP/(TP+FN))

print("Precision:", precision)
print("Recall:", recall)


print(f"TP={TP}, FP={FP}, FN={FN}, TN={TN}")

f1 = 2 * (precision * recall) / (precision + recall)
print("F1 Score:", f1)

from sklearn.tree import DecisionTreeClassifier

tree_model = DecisionTreeClassifier(max_depth=3, random_state=42)
tree_model.fit(X_train_scaled, y_train)

y_pred_tree = tree_model.predict(X_test_scaled)

tree_accuracy = np.mean(y_pred_tree == y_test)
print("Tree Test Accuracy:", tree_accuracy)

y_pred_tree_train = tree_model.predict(X_train_scaled)
tree_train_accuracy = np.mean(y_pred_tree_train == y_train)
print("Tree Train Accuracy:", tree_train_accuracy)